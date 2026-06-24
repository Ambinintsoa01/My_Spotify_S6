package com.mp3pipeline.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "playlist_tracks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaylistTrack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_id", nullable = false)
    @JsonIgnore // Évite une récursion infinie lors de la sérialisation JSON
    private Playlist playlist;

    @ManyToOne(fetch = FetchType.EAGER) // Charge directement les métadonnées de la chanson
    @JoinColumn(name = "mp3_id", nullable = false)
    private Mp3Metadata mp3Metadata;

    @Column(nullable = false)
    private Integer position; // Ordre de la chanson dans la playlist
}