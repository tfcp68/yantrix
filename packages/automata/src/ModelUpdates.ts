/** Sets one Object property, preserving the source reference for an equal value. */
export function setModelProperty<ObjectType extends object, Key extends keyof ObjectType>(
	object: ObjectType,
	key: Key,
	value: ObjectType[Key],
): ObjectType {
	return Object.is(object[key], value) ? object : { ...object, [key]: value };
}

/** Updates one Object property without mutating the source Object. */
export function updateModelProperty<ObjectType extends object, Key extends keyof ObjectType>(
	object: ObjectType,
	key: Key,
	update: (value: ObjectType[Key]) => ObjectType[Key],
): ObjectType {
	return setModelProperty(object, key, update(object[key]));
}

/** Performs a shallow immutable merge with no-op reference preservation. */
export function mergeModelObject<ObjectType extends object>(
	object: ObjectType,
	patch: Partial<ObjectType>,
): ObjectType {
	const keys = Reflect.ownKeys(patch) as Array<keyof ObjectType>;
	return keys.every(key => Object.is(object[key], patch[key]))
		? object
		: { ...object, ...patch };
}

/** Removes one own Object property without mutating the source Object. */
export function removeModelProperty<ObjectType extends object, Key extends PropertyKey>(
	object: ObjectType,
	key: Key,
): Omit<ObjectType, Extract<Key, keyof ObjectType>> {
	if (!Object.prototype.hasOwnProperty.call(object, key)) return object;
	const next = { ...object };
	delete (next as Record<PropertyKey, unknown>)[key];
	return next;
}

/** Appends one item to a List without mutating it. */
export function appendModelItem<ItemType>(
	list: ReadonlyArray<ItemType>,
	item: ItemType,
): ItemType[] {
	return [...list, item];
}

/** Updates one List item and preserves untouched item references. */
export function updateModelItem<ListType extends ReadonlyArray<unknown>>(
	list: ListType,
	index: number,
	update: (item: ListType[number], index: number) => ListType[number],
): ListType {
	if (!Number.isInteger(index) || index < 0 || index >= list.length) return list;
	const currentItem = list[index] as ListType[number];
	const nextItem = update(currentItem, index);
	if (Object.is(currentItem, nextItem)) return list;
	const next = [...list];
	next[index] = nextItem;
	return next as unknown as ListType;
}

/** Removes one List item; an invalid index is a structural no-op. */
export function removeModelItem<ListType extends ReadonlyArray<unknown>>(
	list: ListType,
	index: number,
): ListType {
	if (!Number.isInteger(index) || index < 0 || index >= list.length) return list;
	return [...list.slice(0, index), ...list.slice(index + 1)] as unknown as ListType;
}
