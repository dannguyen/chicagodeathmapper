export function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function getSearchTokens(query: string): string[] {
	return query
		.toUpperCase()
		.split(/\W+/)
		.filter((token) => token !== 'AND' && token.replace(/\W+/g, '').trim() !== '');
}

export function highlightFilteredText(text: string, query: string): string {
	const tokens = getSearchTokens(query);

	if (!tokens || tokens.length === 0) {
		return escapeHtml(text);
	}

	const escapedTokens = tokens.map((token) => escapeRegExp(token));
	const pattern = escapedTokens.join('|');
	const regex = new RegExp(`(${pattern})`, 'gi');

	const safeText = escapeHtml(text);
	return safeText.replace(regex, '<span class="bg-yellow-300">$1</span>');
}
