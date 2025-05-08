import { Injectable } from '@angular/core';


class GridPoint {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class GridCell {
    position: GridPoint;
    id: number;

    constructor(point: GridPoint) {
        this.position = point;
        this.id = this.toNumber();
    }

    equals(other: GridCell): boolean {
        return this.position.x === other.position.x && this.position.y === other.position.y;
    }

    left(): GridCell | null {
        if (this.position.x - 1 >= 0) {
            return new GridCell(new GridPoint(this.position.x - 1, this.position.y));
        }
        return null;
    }

    right(): GridCell | null {
        if (this.position.x + 1 < 10) {
            return new GridCell(new GridPoint(this.position.x + 1, this.position.y));
        }
        return null;
    }

    up(): GridCell | null {
        if (this.position.y - 1 >= 0) {
            return new GridCell(new GridPoint(this.position.x, this.position.y - 1));
        }
        return null;
    }

    down(): GridCell | null {
        if (this.position.y + 1 < 10) {
            return new GridCell(new GridPoint(this.position.x, this.position.y + 1));
        }
        return null;
    }

    toNumber(): number {
        if (this.position.y === 0) {
            return this.position.x;
        }
        return parseInt(`${this.position.y}${this.position.x}`);
    }

    static getGridCell(point: string): GridCell {
        if (point.length === 2) {
            const x = parseInt(point[1]);
            const y = parseInt(point[0]);
            return new GridCell(new GridPoint(x, y));
        }
        const y = 0;
        const x = parseInt(point[0]);
        return new GridCell(new GridPoint(x, y));
    }

    static distance(fromCell: GridCell, toCell: GridCell): number {
        const diffX = Math.abs(toCell.position.x - fromCell.position.x);
        const diffY = Math.abs(toCell.position.y - fromCell.position.y);
        return diffX + diffY;
    }
}

class Node {
    cell: GridCell;
    hDistance: number | null = null;
    gDistance: number | null = null;
    parent: Node | null = null;

    constructor(cell: GridCell) {
        this.cell = cell;
    }

    fValue(): number | null {
        if (this.hDistance === null || this.gDistance === null) {
            return null;
        }
        return this.hDistance + this.gDistance;
    }
}

class BoardPath {
    index: number;
    path: number[];
    constructor(index: number, path: number[]) {
        this.index = index;
        this.path = path;
    }
}

class Board {
    grid: GridCell[][];
    path: BoardPath[] = [];
    blockCells: GridCell[] = [];
    closeList: Node[] = [];
    openList: Node[] = [];

    constructor(size: number) {
        this.grid = [];
        for (let y = 0; y < size; y++) {
            const row: GridCell[] = [];
            for (let x = 0; x < size; x++) {
                row.push(new GridCell(new GridPoint(x, y)));
            }
            this.grid.push(row);
        }
    }

    flatterPath(): number[] {
        const result: number[] = [];
        for (const boardPath of this.path) {
            result.push(...boardPath.path);
        }
        return result;
    }

    getMovementOptions(cell: GridCell, target: GridCell): GridCell[] {
        const options: GridCell[] = [];
        const directions = [cell.left.bind(cell), cell.right.bind(cell), cell.up.bind(cell), cell.down.bind(cell)];
        // Shuffle directions
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        for (const direction of directions) {
            const c = direction();
            if (!c) continue;
            if (this.closeList.some(n => n.cell.id === c.id)) continue;
            if (c.id !== target.id && this.flatterPath().includes(c.id)) continue;
            if (c.id !== target.id && this.blockCells.some(b => b.id === c.id)) continue;
            options.push(c);
        }
        return options;
    }

    getNodeByCell(cell: GridCell): Node | undefined {
        return this.closeList.find(n => n.cell.equals(cell));
    }
}

function getNextIndex(current: number, count: number): number {
    return (current + 1) % count;
}

function createPath(stations: string[], startStationIdx: number): BoardPath[] {
    const board = new Board(10);
    const stationsCells = stations.map(st => GridCell.getGridCell(String(st)));
    let currentStationIndex = startStationIdx;

    for (let i = 0; i < stationsCells.length - 1; i++) {
        const nextStationIndex = getNextIndex(currentStationIndex, stations.length);

        let initIndex: number;
        let targetIndex: number;

        if (currentStationIndex < nextStationIndex) {
            initIndex = currentStationIndex;
            targetIndex = nextStationIndex;
        } else {
            initIndex = nextStationIndex;
            targetIndex = getNextIndex(nextStationIndex, stations.length);
        }

        const init = stationsCells[initIndex];
        const target = stationsCells[targetIndex];
        currentStationIndex = targetIndex;

        board.blockCells = stationsCells.filter(x => x.id !== init.id && x.id !== target.id);

        board.openList = [];
        board.closeList = [];

        board.openList.push(new Node(init));
        let iterations = 0;
        while (board.openList.length > 0) {
            board.openList.sort((a, b) => {
                const fa = a.fValue() ?? Infinity;
                const fb = b.fValue() ?? Infinity;
                return fa - fb;
            });

            const currentNode = board.openList.shift()!;
            if (currentNode.hDistance === null) {
                currentNode.hDistance = GridCell.distance(currentNode.cell, target);
            }
            if (currentNode.parent === null) {
                currentNode.gDistance = 0;
            } else {
                currentNode.gDistance = (currentNode.parent.gDistance ?? 0) + 1;
            }
            board.closeList.push(currentNode);

            const moveOptions = board.getMovementOptions(currentNode.cell, target);
            for (const cell of moveOptions) {
                let newNode = board.getNodeByCell(cell);
                if (!newNode) {
                    newNode = new Node(cell);
                }
                if (newNode.hDistance === null) {
                    newNode.hDistance = GridCell.distance(newNode.cell, target);
                }
                if (newNode.parent !== null) {
                    const tempNode = new Node(cell);
                    tempNode.hDistance = GridCell.distance(newNode.cell, target);
                    tempNode.parent = currentNode;
                    tempNode.gDistance = (tempNode.parent.gDistance ?? 0) + 1;
                    if ((tempNode.fValue() ?? Infinity) < (newNode.fValue() ?? Infinity)) {
                        newNode.parent = currentNode;
                    }
                } else {
                    newNode.parent = currentNode;
                }
                newNode.gDistance = (newNode.parent.gDistance ?? 0) + 1;
                if (!board.openList.some(node => node.cell.id === newNode!.cell.id)) {
                    board.openList.push(newNode);
                }
            }
            iterations++;
            if (currentNode.cell.id === target.id) {
                let pathNode: Node | null = currentNode;
                const path: Node[] = [];
                while (pathNode !== null) {
                    path.unshift(pathNode);
                    pathNode = pathNode.parent;
                }
                const pathNumbers = path.map(node => node.cell.id);
                board.path.push(new BoardPath(initIndex, pathNumbers));
                break;
            }
        }
    }
    board.path.sort((a, b) => a.index - b.index);
    return board.path;
}

@Injectable({
    providedIn: 'root'
})
export class FourPassTransportService {
    constructor() {}

    four_pass(stations: string[]): BoardPath[] | null {
        const solutions: BoardPath[][] = [];
        for (let i = 0; i < 20; i++) {
            const nextIndex = i % 3;
            const solution = createPath(stations, nextIndex);
            if (solution.length === 3) {
                solutions.push(solution);
            }
        }
        
        // Sort solutions by total path length
        solutions.sort((a, b) => {
            const totalLengthA = a.reduce((total, path) => total + path.path.length, 0);
            const totalLengthB = b.reduce((total, path) => total + path.path.length, 0);
            return totalLengthA - totalLengthB;
        });
        
        if (solutions.length > 0) {
            return solutions[0];
        }
        return null;
    }
}