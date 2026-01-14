import { API_URL } from "../api/config"

export const generateRecommendation = async (data) => {
    try {
        const response = await fetch(`${API_URL}/recommendations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data)
        })
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        return await response.json()
    } catch (error) {
        console.error("API call failed:", error)
        throw error
    }
}

export const getPriceStats = async () => {
    try {
        const response = await fetch(`${API_URL}/price-stats`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        })
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        return await response.json()
    } catch (error) {
        console.error("Failed to fetch price stats:", error)
        return { success: false, error: "Failed to fetch statistics" }
    }
}

// Optional: Add a function to fetch establishments
export const fetchEstablishments = async (url) => {
    try {
        const response = await fetch(`${API_URL}/establishments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ url })
        })
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        return await response.json()
    } catch (error) {
        console.error("Failed to fetch establishments:", error)
        throw error
    }
}