import numeral from 'numeral';
// import { DateTime, Duration } from 'luxon';

export function currentAgeInDays(dateVal: string | Date): number {
	let pastDate: Date | null = null;
	if (dateVal instanceof Date === true) {
		pastDate = dateVal;
	} else {
		pastDate = new Date(dateVal);
	}
	const currentDate = new Date();

	// Calculate difference in milliseconds
	const diffMs = currentDate.getTime() - pastDate.getTime();

	// Convert milliseconds to days (1000ms * 60s * 60min * 24hr)
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	return diffDays;
}

export function currentAgePrettified(dayVal: number | Date): string {
	let days: number | any = 0;

	if (dayVal instanceof Date === true) {
		days = currentAgeInDays(dayVal);
	} else {
		days = dayVal;
	}

	if (days < 0) {
		return '0d';
	}

	// Calculate years, months, and remaining days
	const years = Math.floor(days / 365);
	let remainingDays = days % 365;

	// Calculate months (approximate - using 30 days per month)
	const months = Math.floor(remainingDays / 30);
	remainingDays = remainingDays % 30;

	// Build the string based on what units we have
	let result = '';

	if (years > 0) {
		result += `${years}y`;
	}

	if (months > 0 || (years > 0 && remainingDays > 0)) {
		result += ` ${months}m`;
	}

	if (remainingDays > 0 || (years === 0 && months === 0)) {
		result += ` ${remainingDays}d`;
	}

	return result.trim();
}

export function currentAgeSimplified(dayVal: number | Date): string {
	let days: number | any = 0;

	if (dayVal instanceof Date === true) {
		days = currentAgeInDays(dayVal);
	} else {
		days = dayVal;
	}

	if (days <= 1) {
		return 'A day ago';
	} else if (days > 365 * 2) {
		return `${Math.floor(days / 365)} years ago`;
	} else if (days > 60) {
		return `${Math.floor(days / 30)} months ago`;
	} else {
		return `${days} ago`;
	}
}

export function prettifyInteger(num: number): string {
	// let fmt = '0';
	// if (num >= 1000) {
	//     fmt = '0.0 a';
	// }

	return numeral(num).format('0,0');
}
