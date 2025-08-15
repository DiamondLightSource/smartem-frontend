export const apiUrl = () => {
    return process.env.REACT_APP_ENDPOINT ? process.env.REACT_APP_ENDPOINT: "http://localhost:8000"
}