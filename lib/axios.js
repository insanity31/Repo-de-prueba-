import axios from 'axios'

// Configuración global para silenciar logs molestos
const instance = axios.create({
    timeout: 30000,
    maxRedirects: 5,
    validateStatus: (status) => status < 500
})

// Interceptor para logs limpios
instance.interceptors.request.use(
    (config) => config,
    (error) => {
        console.error('❌ Error en petición:', error.message)
        return Promise.reject(error)
    }
)

instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 404) {
            console.error('❌ Recurso no encontrado (404)')
        } else if (error.code === 'ECONNABORTED') {
            console.error('❌ Tiempo de espera agotado')
        } else {
            console.error('❌ Error:', error.message)
        }
        return Promise.reject(error)
    }
)

export default instance