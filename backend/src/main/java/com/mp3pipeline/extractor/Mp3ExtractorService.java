package com.mp3pipeline.extractor;

import com.mp3pipeline.config.RabbitMQConfig;
import com.mp3pipeline.messaging.Mp3FileMessage;
import com.mp3pipeline.messaging.Mp3MetadataMessage;
import com.mpatric.mp3agic.ID3v1;
import com.mpatric.mp3agic.ID3v2;
import com.mpatric.mp3agic.Mp3File;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * ══════════════════════════════════════════════════════
 * PROGRAMME 2 — Extractor (Version Mp3Agic)
 * ══════════════════════════════════════════════════════
 * Consomme les messages de {@code mp3.watcher.to.extractor}.
 * Pour chaque fichier .mp3 reçu :
 * 1. Extrait toutes les métadonnées audio (titre, artiste, album, durée…)
 * 2. Publie un {@link Mp3MetadataMessage} pour le Programme 3.
 */
@Service
public class Mp3ExtractorService {

    private static final Logger log = LoggerFactory.getLogger(Mp3ExtractorService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final RabbitTemplate rabbitTemplate;

    public Mp3ExtractorService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Listener RabbitMQ : un message = un fichier .mp3 à traiter.
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_WATCHER_TO_EXTRACTOR_WORK)
    public void onMp3FileReceived(Mp3FileMessage message) {
        String now = LocalDateTime.now().format(FMT);
        log.info("[EXTRACTOR] [{}] Message reçu — début extraction : {}",
                now, message.getFileName());

        try {
            Map<String, String> metadata = extractMetadata(message.getFilePath());

            now = LocalDateTime.now().format(FMT);
            log.info("[EXTRACTOR] [{}] Extraction terminée pour : {} — {} champ(s) extraits.",
                    now, message.getFileName(), metadata.size());

            publishToSender(message, metadata);

        } catch (Exception e) {
            now = LocalDateTime.now().format(FMT);
            log.error("[EXTRACTOR] [{}] Erreur lors de l'extraction des métadonnées de '{}' : {}",
                    now, message.getFileName(), e.getMessage(), e);
        }
    }

    /**
     * Extrait les métadonnées d'un fichier .mp3 via mp3agic.
     * Retourne une Map triée clé/valeur (String → String).
     */
    public Map<String, String> extractMetadata(String filePath) throws Exception {
        File file = new File(filePath);

        if (!file.exists()) {
            throw new IllegalArgumentException("Fichier introuvable : " + filePath);
        }
        if (!file.canRead()) {
            throw new IllegalStateException("Fichier non lisible : " + filePath);
        }

        Map<String, String> metadata = new LinkedHashMap<>();

        // ── Informations système du fichier ───────────────────────────────────
        metadata.put("file_name", file.getName());
        metadata.put("file_path", file.getAbsolutePath());
        metadata.put("file_size_bytes", String.valueOf(file.length()));

        // ── Informations audio via Mp3File ────────────────────────────────────
        Mp3File mp3File = new Mp3File(filePath);

        metadata.put("audio_bitrate", String.valueOf(mp3File.getBitrate()));
        metadata.put("audio_sample_rate", String.valueOf(mp3File.getSampleRate()));
        metadata.put("audio_duration_secs", String.valueOf(mp3File.getLengthInSeconds()));
        metadata.put("audio_is_vbr", String.valueOf(mp3File.isVbr()));

        // ── Tags ID3 (Priorité ID3v2, fallback sur ID3v1) ─────────────────────
        if (mp3File.hasId3v2Tag()) {
            ID3v2 id3v2 = mp3File.getId3v2Tag();
            metadata.put("tag_title", safeTrim(id3v2.getTitle()));
            metadata.put("tag_artist", safeTrim(id3v2.getArtist()));
            metadata.put("tag_album", safeTrim(id3v2.getAlbum()));
            metadata.put("tag_year", safeTrim(id3v2.getYear()));
            metadata.put("tag_genre", safeTrim(id3v2.getGenreDescription()));
            metadata.put("tag_track", safeTrim(id3v2.getTrack()));
            metadata.put("tag_comment", safeTrim(id3v2.getComment()));
            metadata.put("tag_composer", safeTrim(id3v2.getComposer()));
        } else if (mp3File.hasId3v1Tag()) {
            ID3v1 id3v1 = mp3File.getId3v1Tag();
            metadata.put("tag_title", safeTrim(id3v1.getTitle()));
            metadata.put("tag_artist", safeTrim(id3v1.getArtist()));
            metadata.put("tag_album", safeTrim(id3v1.getAlbum()));
            metadata.put("tag_year", safeTrim(id3v1.getYear()));
            metadata.put("tag_genre", safeTrim(id3v1.getGenreDescription()));
            metadata.put("tag_track", safeTrim(id3v1.getTrack()));
            metadata.put("tag_comment", safeTrim(id3v1.getComment()));
            metadata.put("tag_composer", "");
        } else {
            log.warn("[EXTRACTOR] Aucun tag ID3 trouvé dans : {}", filePath);
        }

        return metadata;
    }

    /**
     * Publie le résultat vers la queue extractor → sender.
     */
    private void publishToSender(Mp3FileMessage fileMessage, Map<String, String> metadata) {
        String now = LocalDateTime.now().format(FMT);
        try {
            Mp3MetadataMessage msg = new Mp3MetadataMessage(
                    fileMessage.getFilePath(),
                    fileMessage.getFileName(),
                    metadata,
                    Instant.now().toEpochMilli());

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.MP3_EXCHANGE,
                    RabbitMQConfig.RK_EXTRACTOR_TO_SENDER,
                    msg);

            log.info("[EXTRACTOR] [{}] Métadonnées publiées dans la queue → [{}]",
                    now, fileMessage.getFileName());

        } catch (Exception e) {
            log.error("[EXTRACTOR] [{}] Échec de publication des métadonnées de '{}' : {}",
                    now, fileMessage.getFileName(), e.getMessage(), e);
        }
    }

    /**
     * Utilitaire pour éviter les NullPointerException sur les chaînes de caractères
     */
    private String safeTrim(String val) {
        return val != null ? val.trim() : "";
    }
}