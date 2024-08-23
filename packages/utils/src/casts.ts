export function unifyObjectKey<KeyType = number>(key: string | number): KeyType {
	return Number.parseInt(String(key)) as unknown as KeyType;
}
