import redis from "redis";

let redisClientSub;
let redisClientPub;

(async () => {
    redisClientSub = redis.createClient({
        url: 'redis://:@209.38.247.188:6379'
    });
    redisClientSub.on("connect", () => console.log("Redis client sub connected"));
    redisClientSub.on("error", (err) => console.log("Something went wrong " + err));
    if (!redisClientSub.isOpen)
        await redisClientSub.connect();
})();
(async () => {
    redisClientPub = redis.createClient({
        url: 'redis://:@209.38.247.188:6379'
    });

    redisClientPub.on("connect", () => console.log("Redis client pub connected."));
    redisClientPub.on("error", (err) => console.log("Something went wrong " + err));
    if (!redisClientPub.isOpen)
        await redisClientPub.connect();
})();

export { redisClientSub, redisClientPub };
