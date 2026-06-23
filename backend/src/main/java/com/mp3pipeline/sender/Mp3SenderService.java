package com.mp3pipeline.sender;

import com.mp3pipeline.cleaner.Mp3CleanerService;
import com.mp3pipeline.config.PipelineProperties;
import com.mp3pipeline.config.RabbitMQConfig;
import com.mp3pipeline.messaging.Mp3MetadataMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * ══════════════════════════════════════════════════════
 *  PROGRAMME 3 — Sender
 * ══════════════════════════════════════════════════════
 * Consomme les messages de {@code mp3.extractor.to.sender}.
 * Pour chaque message reçu (fichier + métadonnées) :
 *   1. Envoie le fichier .mp3 et ses métadonnées vers l'API HTTP.
 *   2. En cas de succès → délègue la suppression au {@link Mp3CleanerService}.
 *   3. En cas d'échec  → log l'erreur, conserve le fichier.
 *
 * L'envoi se fait en multipart/form-data :
 *   - Part "file"     : le fichier binaire .mp3
 *   - Part "metadata" : JSON des métadonnées
 */
@Service
public class Mp3SenderService {

    private static final Logger log = LoggerFactory.getLogger(Mp3SenderService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final PipelineProperties props;
    private final RestTemplate        restTemplate;
    private final Mp3CleanerService   cleaner;

    public Mp3SenderService(PipelineProperties props,
                            RestTemplate restTemplate,
                            Mp3CleanerService cleaner) {
        this.props        = props;
        this.restTemplate = restTemplate;
        this.cleaner      = cleaner;
    }

    /**
     * Listener RabbitMQ : un message = un fichier prêt à être envoyé.
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_EXTRACTOR_TO_SENDER)
    public void onMetadataReceived(Mp3MetadataMessage message) {
        String now = LocalDateTime.now().format(FMT);
        log.info("[SENDER] [{}] Message reçu — envoi en cours : {}",
                now, message.getFileName());

        boolean success = sendToApi(message);

        now = LocalDateTime.now().format(FMT);
        if (success) {
            log.info("[SENDER] [{}] Envoi réussi : {}", now, message.getFileName());
            cleaner.deleteFile(message.getFilePath(), message.getFileName());
        } else {
            log.warn("[SENDER] [{}] Envoi échoué, fichier conservé : {}",
                    now, message.getFileName());
        }
    }

    /**
     * Envoie le fichier .mp3 + ses métadonnées à l'API en multipart/form-data.
     *
     * @return true si la réponse HTTP est 2xx, false sinon.
     */
    private boolean sendToApi(Mp3MetadataMessage message) {
        String now = LocalDateTime.now().format(FMT);
        String apiUrl = props.getApiUrl();

        File file = new File(message.getFilePath());
        if (!file.exists()) {
            log.error("[SENDER] [{}] Fichier introuvable avant envoi : {}",
                    now, message.getFilePath());
            return false;
        }

        try {
            // ── Construction du corps multipart ───────────────────────────────
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            // Part 1 : fichier binaire
            body.add("file", new FileSystemResource(file));

            // Part 2 : métadonnées au format JSON (string brut)
            body.add("fileName", message.getFileName());
            body.add("filePath", message.getFilePath());

            // Ajoute chaque métadonnée comme champ de formulaire
            if (message.getMetadata() != null) {
                message.getMetadata().forEach(body::add);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity =
                    new HttpEntity<>(body, headers);

            log.info("[SENDER] [{}] Envoi HTTP vers {} — fichier : {}",
                    now, apiUrl, message.getFileName());

            ResponseEntity<String> response =
                    restTemplate.exchange(apiUrl, HttpMethod.POST, requestEntity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[SENDER] [{}] Réponse API {} pour : {}",
                        now, response.getStatusCode().value(), message.getFileName());
                return true;
            } else {
                log.warn("[SENDER] [{}] Réponse API non-2xx ({}) pour : {}",
                        now, response.getStatusCode().value(), message.getFileName());
                return false;
            }

        } catch (Exception e) {
            log.error("[SENDER] [{}] Exception lors de l'envoi de '{}' vers {} : {}",
                    now, message.getFileName(), apiUrl, e.getMessage(), e);
            return false;
        }
    }
}
