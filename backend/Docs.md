Je vais générer l'ensemble du projet Spring Boot. C'est un projet conséquent, je commence par la structure complète.Maintenant je génère le ZIP final :Voici le projet complet. Voici ce qui a été généré :

---

## Ce qui est dans le ZIP

### 4 programmes dans une seule application Spring Boot

| Programme | Classe | Rôle |
|---|---|---|
| **P1 — Watcher** | `Mp3WatcherService` | Scan périodique du répertoire, publie dans RabbitMQ |
| **P2 — Extractor** | `Mp3ExtractorService` | Consomme P1, extrait les tags ID3 + infos audio, publie vers P3 |
| **P3 — Sender** | `Mp3SenderService` | Consomme P2, envoie en `multipart/form-data` vers l'API |
| **P4 — Cleaner** | `Mp3CleanerService` | Supprime le fichier après envoi réussi, notifie le Watcher |

### Architecture des queues RabbitMQ

```
P1 ──► [mp3.watcher.to.extractor] ──► P2 ──► [mp3.extractor.to.sender] ──► P3
```
P3 ne voit jamais les messages de P1 — c'est bien une chaîne de queues distinctes.

### Métadonnées extraites par P2 (jaudiotagger)
`title`, `artist`, `album`, `year`, `genre`, `track`, `bpm`, `composer`, `comment`, `lyrics` + `bitrate`, `sample_rate`, `duration`, `format`, `file_size`…

### Log unique partagé
`logback-spring.xml` : fichier roulant quotidien, 30 jours d'historique, chaque programme préfixe ses lignes par `[WATCHER]`, `[EXTRACTOR]`, `[SENDER]`, `[CLEANER]`.

---

## Pour démarrer

```bash
# 1. Lancer RabbitMQ
docker compose up -d

# 2. Compiler
mvn clean package -DskipTests

# 3. Lancer
java -jar target/mp3-pipeline-1.0.0.jar \
  --mp3.pipeline.inbox-directory=./mp3-inbox \
  --mp3.pipeline.api-url=http://ton-api.com/upload

# 4. Déposer un fichier
cp ma-chanson.mp3 ./mp3-inbox/
```