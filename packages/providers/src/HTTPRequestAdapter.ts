import {
	createPromiseDataAdapter,
	IDataDestination,
	IDataSource,
	TAutomataBaseEventType,
	TAutomataEventMetaType,
	TAutomataEventStack,
} from '@yantrix/automata';
import { uniqId } from '@yantrix/utils';

/** @see {@link THTTPRequestAdapterProps} */
export type THTTPRequestAdapterRequest = Request | (RequestInit & { url: string | URL });

/** @see {@link createHTTPRequestAdapter} */
export type THTTPRequestAdapterInput = {
	request: THTTPRequestAdapterRequest;
	event_id: TAutomataBaseEventType;
};

/** @see {@link createHTTPRequestAdapter} */
export type THTTPRequestAdapterOutput = {
	response: Response;
	event_id: TAutomataBaseEventType;
};

/** @see {@link THTTPRequestAdapterRequest} */
export type THTTPRequestAdapterProps<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends Record<EventType, any>,
> = {
	/** An optional id for the `Data Source` and `Data Destination`. */
	id?: string;
	/** An object with `Event` names as keys and an array with the request options and the response mapper as values. */
	routes: Partial<{ [K in EventType]: [
		(event: TAutomataEventMetaType<K, EventMetaType>) => THTTPRequestAdapterRequest | null,
		(data: Response) => TAutomataEventStack<EventType, EventMetaType>,
	] }>;
};

/**
 * Creates a `Data Source` and a `Data Destination` that are connected by a list of HTTP requests, each initiated by a certain `Event`.
 *
 * @param opts
 * @returns An array with the `Data Source` and the `Data Destination`.
 */
export function createHTTPRequestAdapter<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends Record<EventType, any>,
>(opts: THTTPRequestAdapterProps<EventType, EventMetaType>): [
	IDataSource<EventType, EventMetaType, THTTPRequestAdapterOutput>,
	IDataDestination<EventType, EventMetaType, null, THTTPRequestAdapterInput, THTTPRequestAdapterOutput>,
] {
	const { id = uniqId(), routes } = opts;

	const requestEvents = Object.keys(routes).map(x => Number.parseInt(x)) as EventType[];

	const reqHandler = (event: TAutomataEventMetaType<EventType, EventMetaType>): THTTPRequestAdapterInput | null => {
		if (event?.event == null)
			return null;
		const opts = routes[event.event];
		if (!opts)
			return null;
		const request = opts[0](event);
		if (!request) return null;
		return {
			request,
			event_id: event.event,
		};
	};

	const rspHandler = (data: THTTPRequestAdapterOutput): TAutomataEventStack<EventType, EventMetaType> => {
		const eId = data?.event_id as EventType;
		if (eId == null)
			return [];
		const opts = routes[eId];
		if (!opts || !opts[1])
			return [];
		return opts[1](data.response);
	};

	return createPromiseDataAdapter<EventType, EventMetaType, THTTPRequestAdapterInput, THTTPRequestAdapterOutput>({
		id,
		resolver: async (data: THTTPRequestAdapterInput) => {
			const { request } = data;
			const response = await fetch(request instanceof Request ? request : new Request(request.url, request));
			return { response, event_id: data.event_id };
		},
		requestEvents,
		requestMapper: reqHandler,
		responseMapper: rspHandler,
	});
}
