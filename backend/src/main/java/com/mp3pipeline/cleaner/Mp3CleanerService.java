package com.mp3pipeline.cleaner;

import com.mp3pipeline.watcher.Mp3WatcherService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * ══════════════════════════════════════════════════════
 *  PROGRAMME 4 — Cleaner
 * ══════════════════════════════════════════════════════
 * Responsable de la suppression du fichier .mp3 du disque
 * après que le Programme 3 (Sender) a confirmé un envoi réussi.
 *
 * Après suppression, notifie le Watcher pour retirer l'entrée
 * de son cache local, permettant une éventuelle ré-détection.
 */
@Service
public class Mp3CleanerService {

    private static final Logger log = LoggerFactory.getLogger(Mp3CleanerService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Injection @Lazy pour éviter une dépendance circulaire
     * (Watcher → [cache] ← Cleaner).
     */
    private final Mp3WatcherService watcherService;

    public Mp3CleanerService(@Lazy Mp3WatcherService watcherService) {
        this.watcherService = watcherService;
    }

    /**
     * Supprime le fichier .mp3 du répertoire surveillé.
     *
     * @param filePath  chemin absolu du fichier à supprimer
     * @param fileName  nom du fichier (pour les logs)
     */
    public void deleteFile(String filePath, String fileName) {
        String now = LocalDateTime.now().format(FMT);
        Path path = Paths.get(filePath);

        if (!Files.exists(path)) {
            log.warn("[CLEANER] [{}] Fichier déjà absent, rien à supprimer : {}", now, fileName);
            watcherService.forgetFile(filePath);
            return;
        }

        try {
            Files.delete(path);
            log.info("[CLEANER] [{}] Fichier supprimé avec succès : {}", now, fileName);

            // Notifie le Watcher de retirer l'entrée de son cache
            watcherService.forgetFile(filePath);

        } catch (NoSuchFileException e) {
            log.warn("[CLEANER] [{}] Fichier introuvable lors de la suppression : {}", now, fileName);
            watcherService.forgetFile(filePath);

        } catch (IOException e) {
            log.error("[CLEANER] [{}] Impossible de supprimer le fichier '{}' : {}",
                    now, fileName, e.getMessage(), e);
        }
    }
}
