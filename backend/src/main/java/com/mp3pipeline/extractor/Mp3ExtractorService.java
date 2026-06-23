package com.mp3pipeline.extractor;

import com.mp3pipeline.config.RabbitMQConfig;
import com.mp3pipeline.messaging.Mp3FileMessage;
import com.mp3pipeline.messaging.Mp3MetadataMessage;
import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.AudioHeader;
import org.jaudiotagger.tag.FieldKey;
import org.jaudiotagger.tag.Tag;
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
import java.util.logging.Level;

/**
 * ══════════════════════════════════════════════════════
 *  PROGRAMME 2 — Extractor
 * ══════════════════════════════════════════════════════
 * Consomme les messages de {@code mp3.watcher.to.extractor}.
 * Pour chaque fichier .mp3 reçu :
 *   1. Extrait toutes les métadonnées audio (titre, artiste, album,
 *      durée, bitrate, format, taille…)
 *   2. Publie un {@link Mp3MetadataMessage} dans
 *      {@code mp3.extractor.to.sender} pour le Programme 3.
 */
@Service
public class Mp3ExtractorService {

    private static final Logger log = LoggerFactory.getLogger(Mp3ExtractorService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final RabbitTemplate rabbitTemplate;

    public Mp3ExtractorService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
        // Silence les logs verbeux de jaudiotagger
        java.util.logging.Logger.getLogger("org.jaudiotagger").setLevel(Level.WARNING);
    }

    /**
     * Listener RabbitMQ : un message = un fichier .mp3 à traiter.
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_WATCHER_TO_EXTRACTOR)
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
            log.error("[EXTRACTOR] [{}] Erreur lors de l'extraction des métadonnées de '{}' : {}",
                    now, message.getFileName(), e.getMessage(), e);
        }
    }

    /**
     * Extrait les métadonnées d'un fichier .mp3 via jaudiotagger.
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
        metadata.put("file_name",   file.getName());
        metadata.put("file_path",   file.getAbsolutePath());
        metadata.put("file_size_bytes", String.valueOf(file.length()));

        // ── Informations audio (header) ───────────────────────────────────────
        AudioFile audioFile = AudioFileIO.read(file);
        AudioHeader header  = audioFile.getAudioHeader();

        metadata.put("audio_format",          safeGet(() -> header.getFormat()));
        metadata.put("audio_encoding",        safeGet(() -> header.getEncodingType()));
        metadata.put("audio_bitrate",         safeGet(() -> String.valueOf(header.getBitRateAsNumber())));
        metadata.put("audio_sample_rate",     safeGet(() -> header.getSampleRate()));
        metadata.put("audio_channels",        safeGet(() -> header.getChannels()));
        metadata.put("audio_duration_secs",   safeGet(() -> String.valueOf(header.getTrackLength())));
        metadata.put("audio_is_vbr",          safeGet(() -> String.valueOf(header.isVariableBitRate())));
        metadata.put("audio_bits_per_sample", safeGet(() -> String.valueOf(header.getBitsPerSample())));

        // ── Tags ID3 (titre, artiste, album…) ────────────────────────────────
        Tag tag = audioFile.getTag();
        if (tag != null) {
            metadata.put("tag_title",        safeGet(() -> tag.getFirst(FieldKey.TITLE)));
            metadata.put("tag_artist",       safeGet(() -> tag.getFirst(FieldKey.ARTIST)));
            metadata.put("tag_album",        safeGet(() -> tag.getFirst(FieldKey.ALBUM)));
            metadata.put("tag_album_artist", safeGet(() -> tag.getFirst(FieldKey.ALBUM_ARTIST)));
            metadata.put("tag_year",         safeGet(() -> tag.getFirst(FieldKey.YEAR)));
            metadata.put("tag_genre",        safeGet(() -> tag.getFirst(FieldKey.GENRE)));
            metadata.put("tag_track",        safeGet(() -> tag.getFirst(FieldKey.TRACK)));
            metadata.put("tag_comment",      safeGet(() -> tag.getFirst(FieldKey.COMMENT)));
            metadata.put("tag_composer",     safeGet(() -> tag.getFirst(FieldKey.COMPOSER)));
            metadata.put("tag_lyrics",       safeGet(() -> tag.getFirst(FieldKey.LYRICS)));
            metadata.put("tag_language",     safeGet(() -> tag.getFirst(FieldKey.LANGUAGE)));
            metadata.put("tag_bpm",          safeGet(() -> tag.getFirst(FieldKey.BPM)));
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
                    Instant.now().toEpochMilli()
            );

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.MP3_EXCHANGE,
                    RabbitMQConfig.RK_EXTRACTOR_TO_SENDER,
                    msg
            );

            log.info("[EXTRACTOR] [{}] Métadonnées publiées dans la queue → [{}]",
                    now, fileMessage.getFileName());

        } catch (Exception e) {
            log.error("[EXTRACTOR] [{}] Échec de publication des métadonnées de '{}' : {}",
                    now, fileMessage.getFileName(), e.getMessage(), e);
        }
    }

    /** Utilitaire : capture toute exception et retourne "" à la place. */
    private String safeGet(ThrowingSupplier<String> supplier) {
        try {
            String val = supplier.get();
            return val != null ? val.trim() : "";
        } catch (Exception e) {
            return "";
        }
    }

    @FunctionalInterface
    private interface ThrowingSupplier<T> {
        T get() throws Exception;
    }
}
