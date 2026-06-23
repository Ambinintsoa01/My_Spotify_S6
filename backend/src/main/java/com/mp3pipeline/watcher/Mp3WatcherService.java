package com.mp3pipeline.watcher;

import com.mp3pipeline.config.PipelineProperties;
import com.mp3pipeline.config.RabbitMQConfig;
import com.mp3pipeline.messaging.Mp3FileMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * ══════════════════════════════════════════════════════
 *  PROGRAMME 1 — Watcher
 * ══════════════════════════════════════════════════════
 * Surveille périodiquement le répertoire configuré.
 * Pour chaque fichier .mp3 nouvellement détecté,
 * publie un {@link Mp3FileMessage} dans RabbitMQ
 * sur la queue {@code mp3.watcher.to.extractor}.
 *
 * Un fichier déjà publié est mémorisé dans {@code publishedFiles}
 * pour éviter les doublons entre deux cycles de scan.
 */
@Service
public class Mp3WatcherService {

    private static final Logger log = LoggerFactory.getLogger(Mp3WatcherService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final PipelineProperties props;
    private final RabbitTemplate      rabbitTemplate;

    /** Ensemble des chemins déjà soumis à la queue (évite les doublons) */
    private final Set<String> publishedFiles = ConcurrentHashMap.newKeySet();

    private Path inboxPath;

    public Mp3WatcherService(PipelineProperties props, RabbitTemplate rabbitTemplate) {
        this.props         = props;
        this.rabbitTemplate = rabbitTemplate;
    }

    @PostConstruct
    public void init() throws IOException {
        inboxPath = Paths.get(props.getInboxDirectory()).toAbsolutePath().normalize();
        if (!Files.exists(inboxPath)) {
            Files.createDirectories(inboxPath);
            log.info("[WATCHER] Répertoire créé : {}", inboxPath);
        }
        log.info("[WATCHER] Démarré — surveillance de : {} (intervalle : {} min)",
                inboxPath, props.getScanIntervalMinutes());
    }

    /**
     * Scan périodique.
     * L'expression SPEL lit l'intervalle depuis les propriétés
     * (converti en millisecondes).
     */
    @Scheduled(fixedDelayString = "#{@pipelineProperties.scanIntervalMinutes * 60 * 1000}")
    public void scanDirectory() {
        String now = LocalDateTime.now().format(FMT);
        log.info("[WATCHER] [{}] Début du scan du répertoire : {}", now, inboxPath);

        List<Path> mp3Files;
        try (Stream<Path> stream = Files.list(inboxPath)) {
            mp3Files = stream
                    .filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().toLowerCase().endsWith(".mp3"))
                    .collect(Collectors.toList());
        } catch (IOException e) {
            log.error("[WATCHER] [{}] Erreur lors du scan du répertoire '{}' : {}",
                    now, inboxPath, e.getMessage(), e);
            return;
        }

        if (mp3Files.isEmpty()) {
            log.info("[WATCHER] [{}] Aucun fichier .mp3 trouvé.", now);
            return;
        }

        log.info("[WATCHER] [{}] {} fichier(s) .mp3 détecté(s).", now, mp3Files.size());

        for (Path mp3 : mp3Files) {
            String absolutePath = mp3.toAbsolutePath().toString();

            if (publishedFiles.contains(absolutePath)) {
                log.debug("[WATCHER] Fichier déjà publié, ignoré : {}", mp3.getFileName());
                continue;
            }

            publishToQueue(mp3, absolutePath);
        }

        log.info("[WATCHER] [{}] Fin du scan.", now);
    }

    /**
     * Publie un message dans la queue RabbitMQ watcher → extractor.
     */
    private void publishToQueue(Path mp3, String absolutePath) {
        String now = LocalDateTime.now().format(FMT);
        try {
            Mp3FileMessage message = new Mp3FileMessage(
                    absolutePath,
                    mp3.getFileName().toString(),
                    Instant.now().toEpochMilli()
            );

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.MP3_EXCHANGE,
                    RabbitMQConfig.RK_WATCHER_TO_EXTRACTOR,
                    message
            );

            publishedFiles.add(absolutePath);
            log.info("[WATCHER] [{}] Fichier publié dans la queue → [{}]",
                    now, mp3.getFileName());

        } catch (Exception e) {
            log.error("[WATCHER] [{}] Échec publication du fichier '{}' : {}",
                    now, mp3.getFileName(), e.getMessage(), e);
        }
    }

    /**
     * Retire un fichier de la mémoire locale (appelé par le Cleaner
     * après suppression réussie, pour autoriser une ré-détection
     * si le fichier réapparaît).
     */
    public void forgetFile(String absolutePath) {
        publishedFiles.remove(absolutePath);
        log.debug("[WATCHER] Fichier retiré du cache local : {}", absolutePath);
    }
}
