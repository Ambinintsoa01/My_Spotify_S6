# (OK) Ajouter une fonctionnalité `fusion playlist`
- Interface WEB : list playlist
    - Ajouter checkbox sur les playlist
    - Fusionner les playlist checked
    - Ajouter un bouton fusionner

# () Ajouter controlle
- Desktop 
    - Dans sender : 
        - ne pas envoyer les chansons > 180s (audio_duration_secs)
        - ne pas supprimer ce fichier de mp3-inbox et ne pas envoyer dans le frontend 
    - Ajouter une QUEUE dans RabbitMQ qui envoie les chansons scannées (chansons réellement envoyées dans l'API)