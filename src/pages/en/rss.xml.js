import { buildRssResponse } from '../rss.xml.js';

export async function GET(context) {
	return buildRssResponse(context, 'en');
}
