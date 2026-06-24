package com.mp3pipeline.controller;

import com.mp3pipeline.entity.Playlist;
import com.mp3pipeline.entity.PlaylistTrack;
import com.mp3pipeline.entity.Mp3Metadata;
import com.mp3pipeline.repository.PlaylistRepository;
import com.mp3pipeline.repository.PlaylistTrackRepository;
import com.mp3pipeline.repository.Mp3MetadataRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/playlists")
@CrossOrigin(origins = "http://localhost:3000")
public class PlaylistController {

    private final PlaylistRepository playlistRepository;
    private final PlaylistTrackRepository playlistTrackRepository;
    private final Mp3MetadataRepository mp3MetadataRepository;

    public PlaylistController(PlaylistRepository playlistRepository,
            PlaylistTrackRepository playlistTrackRepository,
            Mp3MetadataRepository mp3MetadataRepository) {
        this.playlistRepository = playlistRepository;
        this.playlistTrackRepository = playlistTrackRepository;
        this.mp3MetadataRepository = mp3MetadataRepository;
    }

    // 1. Récupérer toutes les playlists (Page MyPlaylists.jsx)
    @GetMapping
    public ResponseEntity<List<Playlist>> getAllPlaylists() {
        return ResponseEntity.ok(playlistRepository.findAll());
    }

    // 2. Récupérer une playlist par son ID (Page PlaylistDetail.jsx)
    @GetMapping("/{id}")
    public ResponseEntity<Playlist> getPlaylistById(@PathVariable Long id) {
        return playlistRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Supprimer une playlist (Page PlaylistDetail.jsx ou MyPlaylists.jsx)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlaylist(@PathVariable Long id) {
        if (!playlistRepository.existsById(id))
            return ResponseEntity.notFound().build();
        playlistRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // 4. Mettre à jour globalement l'ordre ou la composition des morceaux
    // (Modification / Drag and Drop)
    @PutMapping("/{id}/tracks")
    @Transactional
    public ResponseEntity<Playlist> updatePlaylistTracks(@PathVariable Long id, @RequestBody List<Long> mp3Ids) {
        Playlist playlist = playlistRepository.findById(id).orElse(null);
        if (playlist == null)
            return ResponseEntity.notFound().build();

        // Supprime l'ancienne configuration des pistes
        playlistTrackRepository.deleteByPlaylistId(id);
        playlist.getTracks().clear();

        int position = 0;
        int totalDuration = 0;

        for (Long mp3Id : mp3Ids) {
            Mp3Metadata mp3 = mp3MetadataRepository.findById(mp3Id).orElse(null);
            if (mp3 != null) {
                PlaylistTrack track = PlaylistTrack.builder()
                        .playlist(playlist)
                        .mp3Metadata(mp3)
                        .position(position++)
                        .build();
                playlist.getTracks().add(track);
                totalDuration += mp3.getDurationSeconds() != null ? mp3.getDurationSeconds() : 0;
            }
        }

        playlist.setTotalDurationSecs(totalDuration);
        Playlist saved = playlistRepository.save(playlist);
        return ResponseEntity.ok(saved);
    }

    // 5. Créer une nouvelle playlist générée intelligemment
    @PostMapping
    @Transactional
    @CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", methods = {RequestMethod.POST, RequestMethod.OPTIONS})
    public ResponseEntity<Playlist> createPlaylist(@RequestBody Map<String, Object> payload) {
        String name = (String) payload.get("name");
        String description = (String) payload.get("description");
        List<Integer> mp3IdsRaw = (List<Integer>) payload.get("mp3Ids");

        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // 1. Initialisation et sauvegarde de la Playlist de base
        Playlist playlist = Playlist.builder()
                .name(name)
                .description(description)
                .totalDurationSecs(0)
                .tracks(new java.util.ArrayList<>())
                .build();

        Playlist savedPlaylist = playlistRepository.save(playlist);

        int position = 0;
        int totalDuration = 0;

        // 2. Association des pistes MP3 si la liste n'est pas vide
        if (mp3IdsRaw != null && !mp3IdsRaw.isEmpty()) {
            for (Integer rawId : mp3IdsRaw) {
                Long mp3Id = rawId.longValue();
                Mp3Metadata mp3 = mp3MetadataRepository.findById(mp3Id).orElse(null);

                if (mp3 != null) {
                    PlaylistTrack track = PlaylistTrack.builder()
                            .playlist(savedPlaylist)
                            .mp3Metadata(mp3)
                            .position(position++)
                            .build();

                    playlistTrackRepository.save(track);
                    savedPlaylist.getTracks().add(track);
                    totalDuration += mp3.getDurationSeconds() != null ? mp3.getDurationSeconds() : 0;
                }
            }
        }

        // 3. Mise à jour de la durée totale calculée et sauvegarde finale
        savedPlaylist.setTotalDurationSecs(totalDuration);
        Playlist finalSaved = playlistRepository.save(savedPlaylist);

        return ResponseEntity.ok(finalSaved);
    }
}