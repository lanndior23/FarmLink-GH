import React from 'react';

function CropsList({ crops, setCrops }) {
    const handleDelete = async (cropId) => {
        try {
            // Replace with your API endpoint for deleting a crop
            await fetch(`/api/crops/${cropId}`, { method: 'DELETE' });
            // Remove the deleted crop from the UI
            setCrops(crops.filter(crop => crop.id !== cropId));
        } catch (error) {
            console.error('Failed to delete crop:', error);
        }
    };

    return (
        <div>
            <ul>
                {crops.map(crop => (
                    <li key={crop.id}>
                        {/* Display crop details here */}
                        <span>{crop.name}</span>
                        <button onClick={() => handleDelete(crop.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default CropsList;