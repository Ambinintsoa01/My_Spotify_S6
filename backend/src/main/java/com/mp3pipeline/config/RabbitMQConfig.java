package com.mp3pipeline.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration RabbitMQ pour le pipeline MP3.
 *
 * Architecture des queues :
 *
 *   [Programme 1 - Watcher]
 *       └─► Exchange: mp3.exchange
 *               ├─► Queue: mp3.watcher.to.extractor         (monitoring, non consommée)
 *               └─► Queue: mp3.watcher.to.extractor.work    (lue par Programme 2)
 *
 *   [Programme 2 - Extractor]
 *       └─► Exchange: mp3.exchange
 *               ├─► Queue: mp3.extractor.to.sender         (monitoring, non consommée)
 *               └─► Queue: mp3.extractor.to.sender.work    (lue par Programme 3)
 *
 *   [Programme 3 - Sender]
 *       ├─► Queue: mp3.sender.sent.to.api     (morceaux réellement envoyés)
 *       └─► (suppression des fichiers après succès)
 */
@Configuration
public class RabbitMQConfig {

    // ── Noms des exchanges ────────────────────────────────────────────────────
    public static final String MP3_EXCHANGE = "mp3.exchange";

    // ── Noms des queues ───────────────────────────────────────────────────────
    /** Queue P1 → P2 : liste de chemins de fichiers .mp3 détectés */
    public static final String QUEUE_WATCHER_TO_EXTRACTOR   = "mp3.watcher.to.extractor";
    public static final String QUEUE_WATCHER_TO_EXTRACTOR_WORK = "mp3.watcher.to.extractor.work";

    /** Queue P2 → P3 : fichier + ses métadonnées extraites */
    public static final String QUEUE_EXTRACTOR_TO_SENDER    = "mp3.extractor.to.sender";
    public static final String QUEUE_EXTRACTOR_TO_SENDER_WORK = "mp3.extractor.to.sender.work";

    /** Queue P3 (sortie) : morceaux réellement envoyés à l'API */
    public static final String QUEUE_SENDER_SENT_TO_API      = "mp3.sender.sent.to.api";

    // ── Routing keys ─────────────────────────────────────────────────────────
    public static final String RK_WATCHER_TO_EXTRACTOR  = "watcher.to.extractor";
    public static final String RK_EXTRACTOR_TO_SENDER   = "extractor.to.sender";
    public static final String RK_SENDER_SENT_TO_API    = "sender.sent.to.api";

    // ── Exchange ──────────────────────────────────────────────────────────────
    @Bean
    public TopicExchange mp3Exchange() {
        return ExchangeBuilder.topicExchange(MP3_EXCHANGE)
                .durable(true)
                .build();
    }

    // ── Queues ────────────────────────────────────────────────────────────────
    @Bean
    public Queue queueWatcherToExtractor() {
        return QueueBuilder.durable(QUEUE_WATCHER_TO_EXTRACTOR).build();
    }

    @Bean
    public Queue queueWatcherToExtractorWork() {
        return QueueBuilder.durable(QUEUE_WATCHER_TO_EXTRACTOR_WORK).build();
    }

    @Bean
    public Queue queueExtractorToSender() {
        return QueueBuilder.durable(QUEUE_EXTRACTOR_TO_SENDER).build();
    }

    @Bean
    public Queue queueExtractorToSenderWork() {
        return QueueBuilder.durable(QUEUE_EXTRACTOR_TO_SENDER_WORK).build();
    }

    @Bean
    public Queue queueSenderSentToApi() {
        return QueueBuilder.durable(QUEUE_SENDER_SENT_TO_API).build();
    }

    // ── Bindings ──────────────────────────────────────────────────────────────
    @Bean
    public Binding bindingWatcherToExtractor(Queue queueWatcherToExtractor,
                                             TopicExchange mp3Exchange) {
        return BindingBuilder
                .bind(queueWatcherToExtractor)
                .to(mp3Exchange)
                .with(RK_WATCHER_TO_EXTRACTOR);
    }

        @Bean
        public Binding bindingWatcherToExtractorWork(Queue queueWatcherToExtractorWork,
                             TopicExchange mp3Exchange) {
        return BindingBuilder
            .bind(queueWatcherToExtractorWork)
            .to(mp3Exchange)
            .with(RK_WATCHER_TO_EXTRACTOR);
        }

    @Bean
    public Binding bindingExtractorToSender(Queue queueExtractorToSender,
                                            TopicExchange mp3Exchange) {
        return BindingBuilder
                .bind(queueExtractorToSender)
                .to(mp3Exchange)
                .with(RK_EXTRACTOR_TO_SENDER);
    }

        @Bean
        public Binding bindingExtractorToSenderWork(Queue queueExtractorToSenderWork,
                            TopicExchange mp3Exchange) {
        return BindingBuilder
            .bind(queueExtractorToSenderWork)
            .to(mp3Exchange)
            .with(RK_EXTRACTOR_TO_SENDER);
        }

        @Bean
        public Binding bindingSenderSentToApi(Queue queueSenderSentToApi,
                          TopicExchange mp3Exchange) {
        return BindingBuilder
            .bind(queueSenderSentToApi)
            .to(mp3Exchange)
            .with(RK_SENDER_SENT_TO_API);
        }

    // ── Sérialisation JSON ────────────────────────────────────────────────────
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter);
        return factory;
    }
}
