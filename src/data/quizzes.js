// Multiple-choice questions per lesson, keyed by doc id. Each file exports an array of q(...) from ./quizzes/t.js.
import clientServerHttp from './quizzes/client-server-http';
import dnsCdn from './quizzes/dns-cdn';
import loadBalancer from './quizzes/load-balancer';
import cache from './quizzes/cache';
import databaseReplicationSharding from './quizzes/database-replication-sharding';
import messageQueue from './quizzes/message-queue';
import urlShortener from './quizzes/url-shortener';
import estimation from './quizzes/estimation';
import apiDesign from './quizzes/api-design';
import proxyApiGateway from './quizzes/proxy-api-gateway';
import rateLimiting from './quizzes/rate-limiting';

export const quizzes = {
  'client-server-http': clientServerHttp,
  'dns-cdn': dnsCdn,
  'load-balancer': loadBalancer,
  cache,
  'database-replication-sharding': databaseReplicationSharding,
  'message-queue': messageQueue,
  'url-shortener': urlShortener,
  estimation,
  'api-design': apiDesign,
  'proxy-api-gateway': proxyApiGateway,
  'rate-limiting': rateLimiting,
};
