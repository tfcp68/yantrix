import { createDataDestinationAdapter, NamedDataDestination } from "./DataDestination";
import { createDataSourceAdapter, NamedDataSource } from "./DataSource";
import { TAutomataBaseEventType, TAutomataEventMetaType, TAutomataEventStack } from "./types";
import { IDataDestination, IDataSource } from "./types/interfaces";
import { uniqId } from "@yantrix/utils";

/**
 * Creates a Data Source and a Data Destination that are connected by a
 * function that resolves a Promise with input data and returns the result
 * as an event.
 *
 * @param {Object} opts
 * @param {string} [opts.id] - An optional id for the Data Source and Data Destination
 * @param {Function} opts.resolver - A function that resolves a Promise with input data
 * @param {Function} opts.requestMapper - A function that maps an event to input data
 * @param {Function} opts.responseMapper - A function that maps the result of the resolver to an event
 * @param {EventType[]} [opts.requestEvents]- An array of event names that should trigger the request
 * @param {EventType[]} opts.responseEvents - An array of event names that should be emitted by the Data Source
 * @returns {[IDataSource, IDataDestination]} - An array with the Data Source and the Data Destination
 */
function createPromiseDataAdapter<EventType extends TAutomataBaseEventType, EventMetaType extends Record<EventType, any>, InputData extends object, OutputData extends any>(opts: {
    id?: string,
    resolver: (data: InputData) => Promise<OutputData>,
    requestMapper: (event: TAutomataEventMetaType<EventType, EventMetaType>) => InputData | null,
    responseMapper: (data: OutputData) => TAutomataEventStack<EventType, EventMetaType>
    requestEvents: EventType[] | null,
}
): [IDataSource<EventType, EventMetaType, OutputData>, IDataDestination<EventType, EventMetaType, null, InputData, OutputData>] {

    const { id, resolver, requestEvents, requestMapper, responseMapper } = opts;
    let setterFunction: (data: OutputData) => any;
    const sourceConstructor = createDataSourceAdapter<EventType, EventMetaType, OutputData>()(NamedDataSource<OutputData>);
    const dataSource = new sourceConstructor({
        id,
        afterInit: (_id, setter) => {
            setterFunction = setter;
        }
    });
    const destinationConstructor = createDataDestinationAdapter<EventType, EventMetaType, null, InputData, OutputData>()(NamedDataDestination<InputData, OutputData>);
    const dataDestination = new destinationConstructor({
        id,
        resolver: (data: InputData) => resolver(data).then((result) => {
            setterFunction(result);
            return result;
        }),
    });
    dataDestination.createTrigger(requestEvents, requestMapper);
    dataSource.addListener(uniqId(), responseMapper);
    return [dataSource, dataDestination];
}

type THTTPRequestAdapterInput = {
    request: RequestInit,
    event_id: TAutomataBaseEventType
}
type THTTPRequestAdapterOutput = {
    response: Response,
    event_id: TAutomataBaseEventType
}
/**
 * Creates a Data Source and a Data Destination that are connected by a list of HTTP Requests, each initiated by a certain event
 *
 * @param {Object} opts
 * @param {string} [opts.id] - An optional id for the Data Source and Data Destination
 * @param {Object} opts.routes - An object with event names as keys and an array with the request options and the response mapper as values
 * @returns {[IDataSource, IDataDestination]} - An array with the Data Source and the Data Destination
 */
export function createHTTPRequestAdapter<EventType extends TAutomataBaseEventType, EventMetaType extends Record<EventType, any>>(opts: {
    id?: string,
    routes: Partial<{ [K in EventType]: [
        (event: TAutomataEventMetaType<K, EventMetaType>) => RequestInit | null,
        (data: Response) => TAutomataEventStack<EventType, EventMetaType>
    ] }>
}
): [IDataSource<EventType, EventMetaType, THTTPRequestAdapterOutput>, IDataDestination<EventType, EventMetaType, null, THTTPRequestAdapterInput, THTTPRequestAdapterOutput>] {
    const { id = uniqId(), routes } = opts;
    const requestEvents = Object.keys(routes).map(x => parseInt(x)) as EventType[];
    const requestMapper = (event: TAutomataEventMetaType<EventType, EventMetaType>): THTTPRequestAdapterInput | null => {
        if (!event?.event)
            return null;
        const opts = routes[event.event];
        if (!opts)
            return null;
        const request = opts[0](event);
        if (!request) return null;
        return {
            request,
            event_id: event.event
        };
    };
    const responseMapper = (data: THTTPRequestAdapterOutput): TAutomataEventStack<EventType, EventMetaType> => {
        const eId = data?.event_id as EventType;
        if (!eId)
            return [];
        const opts = routes[eId];
        if (!opts || !opts[1])
            return [];
        return opts[1](data.response);
    };
    return createPromiseDataAdapter<EventType, EventMetaType, THTTPRequestAdapterInput, THTTPRequestAdapterOutput>({
        id,
        resolver: async (data: THTTPRequestAdapterInput) => {
            const request = new Request(id, data.request);
            const response = await fetch(request);
            return { response, event_id: data.event_id };
        },
        requestEvents,
        requestMapper,
        responseMapper,
    });
}
