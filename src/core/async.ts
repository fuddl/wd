export async function findAsync<T>(arr: Array<T>, asyncCallback: (item: T) => Promise<any>): Promise<T | undefined> {
	const results = await mapAsync(arr, asyncCallback)
	const index = results.findIndex(result => result)
	return arr[index]
}

export const mapAsync = async <T, R>(arr: Array<T>, asyncCallback: (item: T) => Promise<R>): Promise<Array<R>> =>
	Promise.all(arr.map(asyncCallback))

export async function wait(delay: number) {
	return await new Promise(resolve => setTimeout(resolve, delay)) 
}