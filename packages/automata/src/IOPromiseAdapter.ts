import { uniqId } from '@yantrix/utils';
import { createDataDestinationAdapter, NamedDataDestination } from './DataDestination';
import { createDataSourceAdapter, NamedDataSource } from './DataSource';
import { TAutomataBaseEventType, TAutomataEventMetaType, TAutomataEventStack } from './types';
import { IDataDestination, IDataSource } from './types/interfaces';

/**
 * Creates a Data Source and a Data Destination that are connected by a
 * function that resolves a Promise with input data and returns the result
 * as an event.
 *
 * @param {object} opts
 * @param {string} [opts.id] - An optional id for the Data Source and Data Destination
 * @param {Function} opts.resolver - A function that resolves a Promise with input data
 * @param {Function} opts.requestMapper - A function that maps an event to input data
 * @param {Function} opts.responseMapper - A function that maps the result of the resolver to an event
 * @param {EventType[]} [opts.requestEvents]- An array of event names that should trigger the request
 * @param {EventType[]} opts.responseEvents - An array of event names that should be emitted by the Data Source
 * @returns {[IDataSource, IDataDestination]} - An array with the Data Source and the Data Destination
 */
export function createPromiseDataAdapter<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends Record<EventType, any>,
	InputData extends object,
	OutputData = any,
>(opts: {
	id?: string;
	resolver: (data: InputData) => Promise<OutputData>;
	requestMapper: (event: TAutomataEventMetaType<EventType, EventMetaType>) => InputData | null;
	responseMapper: (data: OutputData) => TAutomataEventStack<EventType, EventMetaType>;
	requestEvents: EventType[] | null;
},
): [
		IDataSource<EventType, EventMetaType, OutputData>,
		IDataDestination<EventType, EventMetaType, null, InputData, OutputData>,
	] {
	const { id, resolver, requestEvents, requestMapper, responseMapper } = opts;

	let setterFunction: (data: OutputData) => any;

	const SourceConstructor = createDataSourceAdapter<
		EventType,
		EventMetaType,
		OutputData
	>()(NamedDataSource<OutputData>);

	const dataSource = new SourceConstructor({
		id,
		afterInit: (_id, setter) => {
			if (setter)
				setterFunction = setter;
		},
	});

	const DestinationConstructor = createDataDestinationAdapter<
		EventType,
		EventMetaType,
		null,
		InputData,
		OutputData
	>()(NamedDataDestination<InputData, OutputData>);

	const dataDestination = new DestinationConstructor({
		id,
		resolver: (data: InputData) => resolver(data).then((result: OutputData) => {
			setterFunction(result);
			return result;
		}),
	});
	dataDestination.createTrigger(requestEvents, requestMapper);
	dataSource.addListener(uniqId(), responseMapper);

	return [dataSource, dataDestination];
}

/** @see {@link THTTPRequestAdapterProps} */
export type THTTPRequestAdapterRequest = Request | (RequestInit & { url: string | URL });

export type THTTPRequestAdapterInput = {
	request: THTTPRequestAdapterRequest;
	event_id: TAutomataBaseEventType;
};

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
