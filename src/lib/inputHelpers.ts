export function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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
		return text;
	}

	const escapedTokens = tokens.map((token) => escapeRegExp(token));
	const pattern = escapedTokens.join('|');
	const regex = new RegExp(`(${pattern})`, 'gi');

	return text.replace(regex, '<span class="bg-yellow-300">$1</span>');
}
