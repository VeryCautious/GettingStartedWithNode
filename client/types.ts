import { Point } from "./meth"

export type HandState = {
	thumbExtended: boolean
	indexExtended: boolean
	middleExtended: boolean 
	ringExtended: boolean 
	pinkyExtended: boolean
	fingersExtended: number
}

export type RightHandState = {
	pos: Point
	grap: boolean
}