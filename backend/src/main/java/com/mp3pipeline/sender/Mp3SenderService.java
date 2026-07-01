package com.mp3pipeline.sender;

import com.mp3pipeline.cleaner.Mp3CleanerService;
import com.mp3pipeline.config.PipelineProperties;
import com.mp3pipeline.config.RabbitMQConfig;
import com.mp3pipeline.messaging.Mp3MetadataMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * ══════════════════════════════════════════════════════ PROGRAMME 3 — Sender
 * (avec gestion de Blacklist dynamique)
 * ══════════════════════════════════════════════════════
 */
@Service
public class Mp3SenderService {

    private static final Logger log = LoggerFactory.getLogger(Mp3SenderService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // Chemin absolu de destination dans le dossier public/src du frontend React
    private static final String FRONTEND_DIR = "D:\\Github\\My_Spotify_S6\\frontend\\src\\mp3-uploaded";

    // Chemin vers le fichier de blacklist
    private static final String BLACKLIST_FILE_PATH = "D:\\Github\\My_Spotify_S6\\backend\\blacklist.txt";

    private final PipelineProperties props;
    private final RestTemplate restTemplate;
    private final Mp3CleanerService cleaner;
    private final RabbitTemplate rabbitTemplate;

    public Mp3SenderService(PipelineProperties props,
            RestTemplate restTemplate,
            Mp3CleanerService cleaner,
            RabbitTemplate rabbitTemplate) {
        this.props = props;
        this.restTemplate = restTemplate;
        this.cleaner = cleaner;
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Listener RabbitMQ : un message = un fichier prêt à être envoyé.
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_EXTRACTOR_TO_SENDER_WORK)
    public void onMetadataReceived(Mp3MetadataMessage message) {
        String now = LocalDateTime.now().format(FMT);
        log.info("[SENDER] [{}] Message reçu — vérification en cours : {}", now, message.getFileName());

        // ── ÉTAPE DURÉE MAX ──
        if (isDurationAboveLimit(message, 360)) {
            log.warn("[SENDER] [{}] [DUREE] Fichier '{}' ignoré: durée > 360s. Fichier conservé dans l'inbox.",
                    now, message.getFileName());
            // Retour direct: pas d'envoi API, pas de copie frontend, pas de suppression inbox.
            return;
        }

        // ── ÉTAPE BLACKLIST ──
        if (isBlacklisted(message)) {
            log.warn("[SENDER] [{}] [BLACKLIST] Le fichier '{}' correspond à un artiste ou un genre interdit. "
                    + "Traitement arrêté (Fichier conservé dans l'inbox).", now, message.getFileName());
            // Retour direct sans appeler le cleaner -> le fichier reste intact dans ./mp3-inbox
            return;
        }

        // ── FLUX NORMAL ──
        boolean success = sendToApi(message);

        now = LocalDateTime.now().format(FMT);
        if (success) {
            log.info("[SENDER] [{}] Envoi réussi : {}", now, message.getFileName());
            publishSentTrack(message);

            // ── ÉTAPE INTERMÉDIAIRE : Copie vers le frontend avant suppression ──
            boolean copied = copyToFrontend(message.getFilePath(), message.getFileName());

            if (copied) {
                // Si la copie a fonctionné, on peut nettoyer la boîte de réception (inbox) du backend
                cleaner.deleteFile(message.getFilePath(), message.getFileName());
            } else {
                log.warn("[SENDER] [{}] Abandon de la suppression car la copie vers le frontend a échoué : {}",
                        now, message.getFileName());
            }
        } else {
            log.warn("[SENDER] [{}] Envoi échoué, fichier conservé : {}",
                    now, message.getFileName());
        }
    }

    /**
     * Publie dans RabbitMQ la chanson réellement envoyée à l'API.
     */
    private void publishSentTrack(Mp3MetadataMessage message) {
        String now = LocalDateTime.now().format(FMT);
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.MP3_EXCHANGE,
                    RabbitMQConfig.RK_SENDER_SENT_TO_API,
                    message);
            log.info("[SENDER] [{}] Publication queue sent.to.api OK : {}",
                    now, message.getFileName());
        } catch (Exception e) {
            log.error("[SENDER] [{}] Echec publication queue sent.to.api pour '{}' : {}",
                    now, message.getFileName(), e.getMessage(), e);
        }
    }

    /**
     * Analyse le fichier blacklist.txt par section ([artists] / [genres]) et
     * détermine si le fichier courant doit être exclu.
     */
    private boolean isBlacklisted(Mp3MetadataMessage message) {
        Path path = Paths.get(BLACKLIST_FILE_PATH);
        if (!Files.exists(path)) {
            return false; // Si le fichier n'existe pas, on laisse passer
        }

        Map<String, String> metadata = message.getMetadata();
        if (metadata == null || metadata.isEmpty()) {
            return false; // Pas de métadonnées pour comparer
        }

        // Récupération des valeurs (insensible à la casse de la clé dans la Map)
        String mp3Artist = metadata.getOrDefault("tag_artist", metadata.get("Artist"));
        String mp3Genre = metadata.getOrDefault("tag_genre", metadata.get("Genre"));

        String currentArtist = (mp3Artist != null) ? mp3Artist.trim().toLowerCase() : "";
        String currentGenre = (mp3Genre != null) ? mp3Genre.trim().toLowerCase() : "";

        try {
            List<String> lines = Files.readAllLines(path);
            String currentSection = "";

            for (String line : lines) {
                String cleanLine = line.trim();

                // Ignorer les lignes vides ou les commentaires
                if (cleanLine.isEmpty() || cleanLine.startsWith("#")) {
                    continue;
                }

                // Changement de section contextuel
                if (cleanLine.equalsIgnoreCase("[artists]")) {
                    currentSection = "artists";
                    continue;
                } else if (cleanLine.equalsIgnoreCase("[genres]")) {
                    currentSection = "genres";
                    continue;
                }

                String rule = cleanLine.toLowerCase();

                // Filtrage selon la section active
                if ("artists".equals(currentSection) && !currentArtist.isEmpty()) {
                    if (currentArtist.contains(rule)) {
                        log.info("[BLACKLIST MATCH] Artiste bloqué : '{}' correspond à la règle '{}'", mp3Artist, cleanLine);
                        return true;
                    }
                }

                if ("genres".equals(currentSection) && !currentGenre.isEmpty()) {
                    if (currentGenre.contains(rule)) {
                        log.info("[BLACKLIST MATCH] Genre bloqué : '{}' correspond à la règle '{}'", mp3Genre, cleanLine);
                        return true;
                    }
                }
            }
        } catch (IOException e) {
            log.error("[SENDER] Impossible de lire le fichier de blacklist à l'emplacement {} : {}",
                    BLACKLIST_FILE_PATH, e.getMessage());
        }

        return false;
    }

    /**
     * Retourne true si la durée du morceau dépasse la limite donnée (en secondes).
     */
    private boolean isDurationAboveLimit(Mp3MetadataMessage message, int maxSeconds) {
        Map<String, String> metadata = message.getMetadata();
        if (metadata == null || metadata.isEmpty()) {
            return false;
        }

        String durationRaw = metadata.get("audio_duration_secs");
        if (durationRaw == null || durationRaw.isBlank()) {
            return false;
        }

        try {
            int duration = (int) Double.parseDouble(durationRaw.trim());
            return duration > maxSeconds;
        } catch (NumberFormatException e) {
            log.warn("[SENDER] Durée invalide '{}' pour '{}', règle durée ignorée.",
                    durationRaw, message.getFileName());
            return false;
        }
    }

    /**
     * Copie le fichier MP3 traité vers le répertoire source du Frontend React.
     */
    private boolean copyToFrontend(String sourceFilePath, String fileName) {
        String now = LocalDateTime.now().format(FMT);

        Path source = Paths.get(sourceFilePath);
        Path targetDir = Paths.get(FRONTEND_DIR);
        Path targetFile = targetDir.resolve(fileName);

        try {
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
                log.info("[SENDER] [{}] Création du répertoire destination frontend : {}", now, FRONTEND_DIR);
            }

            log.info("[SENDER] [{}] Copie du fichier vers le frontend en cours... -> {}", now, targetFile.toString());
            Files.copy(source, targetFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("[SENDER] [{}] Fichier copié avec succès vers le frontend : {}", now, fileName);
            return true;

        } catch (IOException e) {
            log.error("[SENDER] [{}] Échec de la copie vers le frontend pour '{}' : {}",
                    now, fileName, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Envoie le fichier .mp3 + ses métadonnées à l'API en multipart/form-data.
     */
    private boolean sendToApi(Mp3MetadataMessage message) {
        String now = LocalDateTime.now().format(FMT);
        String apiUrl = props.getApiUrl();

        File file = new File(message.getFilePath());
        if (!file.exists()) {
            log.error("[SENDER] [{}] Fichier introuvable avant envoi : {}", now, message.getFilePath());
            return false;
        }

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(file));
            body.add("fileName", message.getFileName());
            body.add("filePath", message.getFilePath());

            if (message.getMetadata() != null) {
                message.getMetadata().forEach(body::add);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            log.info("[SENDER] [{}] Envoi HTTP vers {} — fichier : {}", now, apiUrl, message.getFileName());

            ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST, requestEntity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[SENDER] [{}] Réponse API {} pour : {}", now, response.getStatusCode().value(), message.getFileName());
                return true;
            } else {
                log.warn("[SENDER] [{}] Réponse API non-2xx ({}) pour : {}", now, response.getStatusCode().value(), message.getFileName());
                return false;
            }

        } catch (Exception e) {
            log.error("[SENDER] [{}] Exception lors de l'envoi de '{}' vers {} : {}", now, message.getFileName(), apiUrl, e.getMessage(), e);
            return false;
        }
    }
}
