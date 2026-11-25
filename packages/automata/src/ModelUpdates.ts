type TModelObject<ObjectType extends object> = Exclude<ObjectType, ReadonlyArray<unknown>>;
type TModelListResult<ListType extends ReadonlyArray<unknown>> =
	ListType extends unknown[] ? Array<ListType[number]> : ReadonlyArray<ListType[number]>;

function assertModelObject(object: object): void {
	if (Array.isArray(object)) throw new TypeError('Object update helpers cannot be used with arrays');
}

/** Sets one `Object` property, preserving the source reference for an equal value. */
export function setModelProperty<ObjectType extends object, Key extends keyof ObjectType>(
	object: TModelObject<ObjectType>,
	key: Key,
	value: ObjectType[Key],
): ObjectType {
	return updateModelProperty<ObjectType, Key>(object, key, () => value);
}

/** Updates one `Object` property without mutating the source `Object`. */
export function updateModelProperty<ObjectType extends object, Key extends keyof ObjectType>(
	object: TModelObject<ObjectType>,
	key: Key,
	update: (value: ObjectType[Key]) => ObjectType[Key],
): ObjectType {
	assertModelObject(object);
	const current = object[key];
	const next = update(current);
	return Object.is(current, next) ? object : { ...object, [key]: next };
}

/** Performs a shallow immutable merge with no-op reference preservation. */
export function mergeModelObject<ObjectType extends object>(
	object: TModelObject<ObjectType>,
	patch: Partial<ObjectType>,
): ObjectType {
	assertModelObject(object);
	const keys = Reflect.ownKeys(patch) as Array<keyof ObjectType>;
	return keys.every(key => Object.is(object[key], patch[key]))
		? object
		: { ...object, ...patch };
}

/** Removes one own `Object` property without mutating the source `Object`. */
export function removeModelProperty<ObjectType extends object, Key extends PropertyKey>(
	object: TModelObject<ObjectType>,
	key: Key,
): Omit<ObjectType, Key> {
	assertModelObject(object);
	if (!Object.prototype.hasOwnProperty.call(object, key)) return object;
	const next = { ...object };
	delete (next as Record<PropertyKey, unknown>)[key];
	return next;
}

/** Appends one item to a `List` without mutating it. */
export function appendModelItem<ItemType>(
	list: ReadonlyArray<ItemType>,
	item: ItemType,
): ItemType[] {
	return [...list, item];
}

/** Updates one `List` item and preserves untouched item references. */
export function updateModelItem<ListType extends ReadonlyArray<unknown>, Index extends number = number>(
	list: ListType,
	index: Index,
	update: (item: ListType[Index], index: Index) => ListType[Index],
): TModelListResult<ListType>;
export function updateModelItem<ItemType>(
	list: ReadonlyArray<ItemType>,
	index: number,
	update: (item: ItemType, index: number) => ItemType,
): ReadonlyArray<ItemType> {
	if (!Number.isInteger(index) || index < 0 || index >= list.length) return list;
	const currentItem = list[index] as ItemType;
	const nextItem = update(currentItem, index);
	if (Object.is(currentItem, nextItem)) return list;
	const next = [...list];
	next[index] = nextItem;
	return next;
}

/** Removes one `List` item. An invalid index preserves the source reference. */
export function removeModelItem<ListType extends ReadonlyArray<unknown>>(
	list: ListType,
	index: number,
): TModelListResult<ListType>;
export function removeModelItem<ItemType>(list: ReadonlyArray<ItemType>, index: number): ReadonlyArray<ItemType> {
	if (!Number.isInteger(index) || index < 0 || index >= list.length) return list;
	return [...list.slice(0, index), ...list.slice(index + 1)];
}
