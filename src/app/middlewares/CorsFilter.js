
const CorsFilter = (req, res, next) => {
    res.removeHeader("Cross-Origin-Resource-Policy") ;
    res.removeHeader("Cross-Origin-Embedder-Policy") ;
    next()
}

export default CorsFilter ;