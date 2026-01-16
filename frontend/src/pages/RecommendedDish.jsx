import { useEffect, useState } from "react"
import { generateRecommendation, getPriceStats } from "../api/api-recommendation"
import Card from "../components/plate-card/Card"

function RecommendedDish() {
    const [formData, setFormData] = useState({
        budget: "",
        numPlates: "",
        algorithm: "optimized",
        maxResults: ""
    })
    const [results, setResults] = useState([])
    const [initialStats, setInitialStats] = useState(null) // Initial stats from getPriceStats
    const [currentStats, setCurrentStats] = useState(null) // Stats from current recommendations
    const [processingTime, setProcessingTime] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    // Load initial price statistics on component mount
    useEffect(() => {
        fetchInitialStats()
    }, [])

    const fetchInitialStats = async () => {
        try {
            const stats = await getPriceStats()
            if (stats.success) {
                setInitialStats(stats)
            }
        } catch (err) {
            console.error("Failed to fetch price statistics", err)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear errors when user types
        if (error) setError("")
    }

    const validateForm = () => {
        if (!formData.budget.trim()) {
            setError("Budget is required")
            return false
        }

        if (!formData.budget.includes("MAD")) {
            setError("Please include 'MAD' in the budget (e.g., '300 MAD')")
            return false
        }

        if (!formData.numPlates || parseInt(formData.numPlates) < 1) {
            setError("Number of plates must be at least 1")
            return false
        }

        if (!formData.maxResults || parseInt(formData.maxResults) < 1) {
            setError("Max results must be at least 1")
            return false
        }

        return true
    }

    const createRecommendations = async (e) => {
        e?.preventDefault()

        if (!validateForm()) {
            console.log('Form is not valid')
            return
        }

        setLoading(true)
        setError("")
        setSuccessMessage("")
        setCurrentStats(null) // Reset current stats

        try {
            const dataToSend = {
                budget: formData.budget,
                numPlates: parseInt(formData.numPlates),
                algorithm: formData.algorithm,
                maxResults: parseInt(formData.maxResults)
            }

            const response = await generateRecommendation(dataToSend)

            if (!response.success) {
                setError(response.error || "Failed to generate recommendations")
                setResults([])
            } else {
                setResults(response.recommendations || [])
                setSuccessMessage(`Found ${response.recommendations?.length || 0} recommendations in ${response.processing_time_ms || 0}ms`)

                // Update current statistics from response
                if (response.statistics) {
                    setCurrentStats(response.statistics)
                }

                setProcessingTime(response.processing_time_ms)
            }
        } catch (err) {
            console.error('Failed to generate recommendations', err)
            setError("Server error. Please try again.")
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    // Helper function to get budget suggestions from initial statistics
    const getBudgetSuggestions = () => {
        if (!initialStats?.price_range) return null

        const { min, max, avg } = initialStats.price_range
        const minNum = parseFloat(min.replace(" MAD", "").replace(",", "."))
        const maxNum = parseFloat(max.replace(" MAD", "").replace(",", "."))
        const avgNum = parseFloat(avg.replace(" MAD", "").replace(",", "."))

        return {
            lowBudget: `Low budget: ${min}`,
            avgBudget: `Average dish: ${avg}`,
            highBudget: `High-end: ${max}`,
            suggestion: `For ${formData.numPlates || 3} plates, try budget: ${(avgNum * (formData.numPlates || 3)).toFixed(2).replace(".", ",")} MAD`
        }
    }

    const budgetSuggestions = getBudgetSuggestions()

    // Helper to get active statistics (current if available, otherwise initial)
    const getActiveStats = () => {
        return currentStats || initialStats
    }

    const activeStats = getActiveStats()

    return (
        <main className="container mx-auto pt-8 bg-neutral-200/50 dark:bg-background-950 h-full min-h-screen px-4">
            <header className="text-center mb-10">
                <h1 className="text-text-900 dark:text-text-50 text-4xl md:text-6xl font-bold mb-3">
                    Dish Recommendations
                </h1>
                <p className="text-text-700 dark:text-text-100 text-sm md:text-base font-medium mb-6 max-w-xl mx-auto">
                    Find the perfect combination of dishes from different restaurants that fit your budget and preferences.
                </p>

                {/* Statistics Banner */}
                {activeStats && (
                    <div className={`bg-background-100 dark:bg-background-900 rounded-xl p-4 mb-6 max-w-4xl mx-auto border-2 border-accent-200 dark:border-accent-100
                            ${(currentStats || budgetSuggestions) && 'divide-y divide-accent-200'}
                        `}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-x divide-accent-200 pb-3">
                            {/* Initial Statistics */}
                            {!currentStats ? (
                                <>
                                    <div className="flex flex-col items-center px-2">
                                        <p className="text-sm text-text-600 dark:text-text-300">Available Stores</p>
                                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                            {activeStats.total_stores || "N/A"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center px-2">
                                        <p className="text-sm text-text-600 dark:text-text-300">Total Dishes</p>
                                        <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                                            {activeStats.total_dishes || "N/A"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center px-2">
                                        <p className="text-sm text-text-600 dark:text-text-300">Price Range</p>
                                        <p className="text-base font-semibold text-secondary-600 dark:text-secondary-400">
                                            {activeStats.price_range?.min || "N/A"} - {activeStats.price_range?.max || "N/A"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center px-2">
                                        <p className="text-sm text-text-600 dark:text-text-300">Average Price</p>
                                        <p className="text-base font-semibold text-accent-600 dark:text-accent-400">
                                            {activeStats.price_range?.avg || "N/A"}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Current Search Statistics */}
                                    <div className="text-center">
                                        <p className="text-sm text-text-600 dark:text-text-300">Found Combinations</p>
                                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                            {currentStats.total_combinations_found || "0"}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-text-600 dark:text-text-300">Avg Price/Plate</p>
                                        <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                                            {currentStats.average_price_per_plate || "N/A"}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-text-600 dark:text-text-300">Stores Used</p>
                                        <p className="text-lg font-semibold text-secondary-600 dark:text-secondary-400">
                                            {currentStats.stores_count || "0"}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-text-600 dark:text-text-300">Dishes Considered</p>
                                        <p className="text-lg font-semibold text-accent-600 dark:text-accent-400">
                                            {currentStats.total_dishes_considered || "0"}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Additional Current Stats */}
                        {currentStats && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 divide-x divide-accent-200">
                                <div className="text-center px-2">
                                    <p className="text-xs text-text-600 dark:text-text-300">Processing Time</p>
                                    <p className="text-sm font-semibold text-text-700 dark:text-text-300">
                                        {processingTime || "0"} ms
                                    </p>
                                </div>
                                <div className="text-center px-2">
                                    <p className="text-xs text-text-600 dark:text-text-300">Minimum Residual</p>
                                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                        {currentStats.min_residual || "N/A"}
                                    </p>
                                </div>
                                <div className="text-center px-2">
                                    <p className="text-xs text-text-600 dark:text-text-300">Maximum Residual</p>
                                    <p className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">
                                        {currentStats.max_residual || "N/A"}
                                    </p>
                                </div>
                            </div>
                        )}

                        {budgetSuggestions && !currentStats && (
                            <div className="mt-4 text-center">
                                <p className="text-sm text-text-700 dark:text-text-300">
                                    💡 {budgetSuggestions.suggestion}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </header>

            <article className="space-y-10">
                {/* Form Section */}
                <section className="bg-background-100 dark:bg-background-900 rounded-xl p-6 shadow-lg border-2 border-accent-200 dark:border-accent-100">
                    <form onSubmit={createRecommendations}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center mb-6">
                            <div>
                                <label htmlFor="budget" className="block text-sm font-medium mb-2 text-text-900 dark:text-text-50">
                                    Budget <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="budget"
                                        name="budget"
                                        type="text"
                                        value={formData.budget}
                                        onChange={handleInputChange}
                                        className="py-3 px-4 block w-full border border-primary-200 dark:border-primary-800 rounded-lg text-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none bg-background-50 dark:bg-background-900 text-text-900 dark:text-text-100 dark:placeholder-text-400 dark:focus:ring-primary-600"
                                        placeholder="e.g., 300 MAD"
                                        required
                                    />
                                </div>
                                {budgetSuggestions && !currentStats && (
                                    <p className="text-xs text-text-500 dark:text-text-400 mt-1">
                                        Suggestions: {budgetSuggestions.lowBudget}, {budgetSuggestions.avgBudget}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="algorithm" className="block text-sm font-medium mb-2 text-text-900 dark:text-text-50">
                                    Algorithm
                                </label>
                                <select
                                    id="algorithm"
                                    name="algorithm"
                                    value={formData.algorithm}
                                    onChange={handleInputChange}
                                    className="py-3 px-4 block w-full border border-primary-200 dark:border-primary-800 rounded-lg text-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none bg-background-50 dark:bg-background-900 text-text-900 dark:text-text-100 dark:placeholder-text-400 dark:focus:ring-primary-600"
                                >
                                    <option value="exact">Exact (Precise)</option>
                                    <option value="optimized">Optimized (Balanced)</option>
                                    <option value="greedy">Greedy (Fast)</option>
                                </select>
                                <p className="text-xs text-text-500 dark:text-text-400 mt-1">
                                    {formData.algorithm === "exact" && "Finds exact combinations, slower"}
                                    {formData.algorithm === "optimized" && "Balanced performance & accuracy"}
                                    {formData.algorithm === "greedy" && "Quick suggestions, less precise"}
                                </p>
                            </div>

                            <div>
                                <label htmlFor="numPlates" className="block text-sm font-medium mb-2 text-text-900 dark:text-text-50">
                                    Plates <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="numPlates"
                                    name="numPlates"
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={formData.numPlates}
                                    onChange={handleInputChange}
                                    className="py-3 px-4 block w-full border border-primary-200 dark:border-primary-800 rounded-lg text-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none bg-background-50 dark:bg-background-900 text-text-900 dark:text-text-100 dark:placeholder-text-400 dark:focus:ring-primary-600"
                                    placeholder="Number of dishes"
                                    required
                                />
                                <p className="text-xs text-text-500 dark:text-text-400 mt-1">
                                    How many dishes do you want?
                                </p>
                            </div>

                            <div>
                                <label htmlFor="maxResults" className="block text-sm font-medium mb-2 text-text-900 dark:text-text-50">
                                    Max Results
                                </label>
                                <input
                                    id="maxResults"
                                    name="maxResults"
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={formData.maxResults}
                                    onChange={handleInputChange}
                                    className="py-3 px-4 block w-full border border-primary-200 dark:border-primary-800 rounded-lg text-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none bg-background-50 dark:bg-background-900 text-text-900 dark:text-text-100 dark:placeholder-text-400 dark:focus:ring-primary-600"
                                    placeholder="Max recommendations"
                                    required
                                />
                                <p className="text-xs text-text-500 dark:text-text-400 mt-1">
                                    Maximum number of recommendations
                                </p>
                            </div>
                        </div>

                        {/* Error and Success Messages */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-red-600 dark:text-red-400 flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </p>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-4 p-3 bg-green-200/55 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-800 rounded-lg">
                                <p className="text-green-600 dark:text-green-400 flex items-center font-semibold">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {successMessage}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className="py-3 px-8 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:pointer-events-none transition-colors duration-200 shadow-md hover:shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-white rounded-full"></span>
                                        Generating Recommendations...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Find Recommendations
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Results Section */}
                <section className="flex flex-col gap-10 pb-8">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                            </div>
                            <p className="text-text-600 dark:text-text-300">
                                Searching for the best dish combinations...
                            </p>
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            {/* Results Summary */}
                            <div className="border-2 border-accent-200 bg-background-100 dark:bg-background-800 rounded-xl p-4">
                                <div className="flex flex-wrap items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-800 dark:text-text-50">
                                            Found {results.length} Recommendation{results.length !== 1 ? 's' : ''}
                                        </h3>
                                        <p className="text-sm text-text-600 dark:text-text-300">
                                            Sorted by best value (lowest residual)
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <p className="text-sm text-text-600 dark:text-text-300 font-semibold">Total Budget</p>
                                            <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                                {formData.budget}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-text-600 dark:text-text-300 font-semibold">Target Plates</p>
                                            <p className="text-lg font-bold text-accent-600 dark:text-accent-400">
                                                {formData.numPlates}
                                            </p>
                                        </div>
                                        {currentStats && (
                                            <div className="text-center">
                                                <p className="text-sm text-text-600 dark:text-text-300 font-semibold">Processing Time</p>
                                                <p className="text-lg font-bold text-accent-600 dark:text-accent-400">
                                                    {processingTime} ms
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Results Cards */}
                            {results.map((recommendation, index) => (
                                <Card
                                    key={index}
                                    index={index}
                                    recommendation={recommendation}
                                    totalRecommendations={results.length}
                                />
                            ))}
                        </>
                    ) : !loading && formData.budget && formData.numPlates ? (
                        <div className="text-center py-12 bg-background-100 dark:bg-background-900 rounded-xl">
                            <svg className="w-16 h-16 mx-auto text-text-400 dark:text-text-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-lg font-semibold text-text-700 dark:text-text-300 mb-2">
                                No recommendations found
                            </h3>
                            <p className="text-text-600 dark:text-text-400 max-w-md mx-auto">
                                Try adjusting your budget or number of plates. The current settings might be too restrictive.
                            </p>
                            <div className="mt-4">
                                <button
                                    onClick={() => {
                                        if (initialStats?.price_range?.avg) {
                                            setFormData(prev => ({
                                                ...prev,
                                                budget: `${parseFloat(initialStats.price_range.avg.replace(" MAD", "").replace(",", ".")) * parseInt(formData.numPlates || 3)} MAD`
                                            }))
                                        }
                                    }}
                                    className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Try with average budget
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="w-20 h-20 mx-auto text-text-300 dark:text-text-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-text-700 dark:text-text-300 mb-2">
                                Enter your preferences to find recommendations
                            </h3>
                            <p className="text-text-600 dark:text-text-400">
                                Fill in the form above to discover perfect dish combinations from multiple restaurants
                            </p>
                        </div>
                    )}
                </section>
            </article>
        </main>
    )
}

export default RecommendedDish