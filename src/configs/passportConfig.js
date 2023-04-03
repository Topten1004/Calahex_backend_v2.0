
const scheme = process.env.JWT_SCHEME || "jwt" ;
const token_prefix = process.env.JWT_TOKEN_PREFIX || "Bearer" ;
const secret_or_key = process.env.JWT_SECRET_OR_KEY || "CA1_SECURITY_KEY" ;
const token_expiration = process.env.JWT_TOKEN_EXPIRATION || 18000000 ;
const token_hash_algo = process.env.JWT_TOKEN_HASH_ALGO || "SHA256" ;

export default {
    JWT_SCHEME : scheme,
    JWT_TOKEN_PREFIX : token_prefix,
    JWT_SECRET_OR_KEY : secret_or_key,
    JWT_TOKEN_EXPIRATION : token_expiration,
    JWT_TOKEN_HASH_ALGO : token_hash_algo
}