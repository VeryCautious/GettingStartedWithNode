export type Point = {
	x: number,
	y: number, 
	z: number
}

export function crossproduct(p1: Point, p2: Point){
	return {
		x: p1.y * p2.z - p1.z * p2.y,
		y: p1.z * p2.x - p1.x * p2.z,
		z: p1.x * p2.y - p1.y * p2.x,
	}
}

export function spatproduct(p1: Point, p2: Point, p3: Point){
	return dotProduct(crossproduct(p1,p2),p3)
}

export function dotProduct(p1: Point, p2: Point) {
	return p1.x * p2.x + p1.y * p2.y + p1.z * p2.z
}

export function normalize(p: Point){
	return scale(p, 1/length(p))
}

export function length(p: Point){
	return Math.sqrt(dotProduct(p,p))
}

export function scale(p: Point, scalar: number){
	return {
		x: scalar*p.x,
		y: scalar*p.y,
		z: scalar*p.z
	}
}

export function diretionBetween(p1: Point, p2: Point){
	return {
		x: p2.x-p1.x,
		y: p2.y-p1.y,
		z: p2.z-p1.z
	}
}