import { useState } from "react";

function Card({ index, recommendation, totalRecommendations }) {
    const [expanded, setExpanded] = useState(false)

    if (!recommendation) {
        return (
            <div className="bg-background-100 dark:bg-background-900 rounded-xl p-6 shadow animate-pulse">
                <div className="h-6 bg-background-200 dark:bg-background-800 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-background-200 dark:bg-background-800 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    const { plates, total_price, residual } = recommendation

    // Calculate total dishes across all plates
    const totalDishes = plates.reduce((sum, plate) =>
        sum + plate.products.reduce((catSum, cat) => catSum + cat.dishes.length, 0), 0)

    // Extract restaurant details for the first restaurant
    const firstRestaurant = plates[0]?.restaurant || {}
    const restaurantInfo = firstRestaurant.info_Details || {}

    return (
        <div className="bg-background-50 dark:bg-background-900  rounded-xl p-6 shadow-lg border border-primary-200 dark:border-primary-800 hover:shadow-xl transition-shadow duration-300">
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-primary-200 dark:border-primary-800">
                <div>
                    <h1 className="text-2xl font-bold text-text-900 dark:text-text-50 mb-2">
                        Recommendation {index + 1} of {totalRecommendations}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full">
                            {plates.length} Restaurant{plates.length !== 1 ? 's' : ''}
                        </span>
                        <span className="px-3 py-1 text-xs font-medium bg-accent-100 dark:bg-accent-900/30 text-accent-800 dark:text-accent-300 rounded-full">
                            {totalDishes} Dish{totalDishes !== 1 ? 'es' : ''}
                        </span>
                    </div>
                </div>

                {/* Price Summary */}
                <div className="mt-3 sm:mt-0">
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-text-600 dark:text-text-300">Total Cost</p>
                            <p className="text-2xl font-bold text-text-900 dark:text-text-50">
                                {total_price}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-text-600 dark:text-text-300">Remaining</p>
                            <p className={`text-lg font-semibold ${parseFloat(residual.replace(" MAD", "").replace(",", ".")) > 0 ? 'text-accent-600 dark:text-accent-400' : 'text-text-600 dark:text-text-400'}`}>
                                {residual}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Restaurants Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {plates.map((plate, plateIndex) => (
                    <div
                        key={plateIndex}
                        className="bg-background-100 dark:bg-background-800 rounded-lg p-4 hover:bg-background-200 dark:hover:bg-background-700 group transition-colors duration-200"
                    >
                        {/* Restaurant Header */}
                        <div className="flex items-start gap-3 mb-4 pb-3 border-b border-primary-200 dark:border-primary-700 group-hover:dark:border-primary-800">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                        {plate.nameStore?.charAt(0).toUpperCase() || "R"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-bold text-lg text-text-900 dark:text-text-50 mb-1">
                                    {plate.nameStore || "Restaurant"}
                                </h3>
                                {plate.url && (
                                    <a
                                        href={plate.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-secondary-600 dark:text-secondary-400 hover:underline text-sm"
                                    >
                                        View on Glovo ↗
                                    </a>
                                )}
                            </div>
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="text-text-500 dark:text-text-400 hover:text-text-700 dark:hover:text-text-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={expanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                                </svg>
                            </button>
                        </div>

                        {/* Restaurant Details */}
                        <div className="mb-4">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {plate.restaurant?.info_Details?.rating && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-text-100 dark:text-white">
                                            ⭐ {plate.restaurant.info_Details.rating}
                                        </span>
                                    </div>
                                )}

                                {plate.restaurant?.info_Details?.eta_store && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-text-700 dark:text-white">
                                            🕒 {plate.restaurant.info_Details.eta_store}
                                        </span>
                                    </div>
                                )}

                                {plate.restaurant?.info_Details?.service_fee && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-text-700 dark:text-white">
                                            💰 {plate.restaurant.info_Details.service_fee}
                                        </span>
                                    </div>
                                )}

                                {plate.restaurant?.info_Details?.badge && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-text-700 dark:text-white">
                                            🏅 {plate.restaurant.info_Details.badge}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Promotions */}
                            {plate.restaurant?.promotions && plate.restaurant.promotions.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-medium text-text-500 dark:text-text-400 group-hover:dark:text-text-200 mb-1">Promotions:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {plate.restaurant.promotions.slice(0, 2).map((promo, i) => (
                                            <span key={i} className="px-2 py-1 text-xs bg-accent-100 dark:bg-accent-900 text-accent-800 dark:text-accent-300 group-hover:dark:text-accent-200 rounded">
                                                {promo}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dishes */}
                        <div>
                            <p className="text-sm font-medium text-text-700 dark:text-text-300 group-hover:dark:text-text-200 mb-2">
                                Selected Dishes:
                            </p>
                            <div className="space-y-2">
                                {plate.products?.flatMap(category =>
                                    category.dishes?.map((dish, dishIndex) => (
                                        <div
                                            key={dishIndex}
                                            className="grid grid-cols-4 gap-2 p-3 bg-background-50 dark:bg-background-900 rounded border border-primary-200 dark:border-primary-700"
                                        >
                                            <div className="col-span-3">
                                                <h4 className="font-medium text-text-800 dark:text-text-200">
                                                    {dish.title || "Dish"}
                                                </h4>
                                                {dish.description && (
                                                    <p className="text-xs text-text-600 dark:text-text-400 truncate wrap-break-word">
                                                        {dish.description}
                                                    </p>
                                                )}
                                                {category.category && (
                                                    <span className="text-xs text-text-500 dark:text-text-500">
                                                        {category.category}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-end gap-2 ml-2 col-span-1 ">
                                                {dish.discount && (
                                                    <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded">
                                                        {dish.discount}
                                                    </span>
                                                )}
                                                <span className="font-semibold text-text-800 dark:text-text-200">
                                                    {dish.price || "0 MAD"}
                                                </span>
                                            </div>
                                        </div>
                                    )) || []
                                ) || []}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Total Summary */}
            <div className="mt-6 pt-4 border-t border-primary-200 dark:border-primary-800">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-text-600 dark:text-text-300">
                            Total dishes from {plates.length} different restaurant{plates.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm text-text-600 dark:text-text-300">Total Price</p>
                            <p className="text-xl font-bold text-text-900 dark:text-text-50">
                                {total_price}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-text-600 dark:text-text-300">Remaining Budget</p>
                            <p className={`text-lg font-semibold ${parseFloat(residual.replace(" MAD", "").replace(",", ".")) > 0 ? 'text-accent-600 dark:text-accent-400' : 'text-text-600 dark:text-text-400'}`}>
                                {residual}
                            </p>
                        </div>
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-300"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={expanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                            </svg>
                            {expanded ? 'Show Less' : 'Show Details'}
                        </button>
                    </div>
                </div>

                {/* Expanded Details */}
                {expanded && (
                    <div className="mt-4 p-4 bg-background-100 dark:bg-background-800 rounded-lg">
                        <h4 className="font-medium text-text-700 dark:text-text-300 mb-2">Detailed Breakdown:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {plates.map((plate, idx) => (
                                <div key={idx} className="text-sm pr-3">
                                    <p className="font-medium text-text-800 dark:text-text-200">
                                        {plate.nameStore}
                                    </p>
                                    <ul className="mt-1 space-y-1">
                                        {plate.products?.flatMap(category =>
                                            category.dishes?.map((dish, dishIdx) => (
                                                <li key={dishIdx} className="flex justify-between">
                                                    <span className="text-text-600 dark:text-text-400">
                                                        • {dish.title}
                                                    </span>
                                                    <span className="font-medium text-text-700 dark:text-text-300">
                                                        {dish.price}
                                                    </span>
                                                </li>
                                            )) || []
                                        ) || []}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Card