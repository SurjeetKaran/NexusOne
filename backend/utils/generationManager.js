const generations = new Map();

function registerGeneration(generationId, record) {
	if (!generationId) return null;
	generations.set(String(generationId), record);
	return record;
}

function getGeneration(generationId) {
	if (!generationId) return null;
	return generations.get(String(generationId)) || null;
}

function removeGeneration(generationId) {
	if (!generationId) return false;
	return generations.delete(String(generationId));
}

module.exports = {
	registerGeneration,
	getGeneration,
	removeGeneration
};