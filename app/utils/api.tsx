export const apiUrl = () => {
    return import.meta.env.VITE_API_ENDPOINT ? import.meta.env.VITE_API_ENDPOINT: "http://localhost:8000"
}