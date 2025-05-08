import { Component, inject, linkedSignal, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FourPassTransportService } from './services/four-pass-transport.service';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [JsonPipe, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  transportService = inject(FourPassTransportService)

  title = 'four-pass-transport';
  
  grid = [
    [0,1,2,3,4,5,6,7,8,9],
    [10,11,12,13,14,15,16,17,18,19],
    [20,21,22,23,24,25,26,27,28,29],
    [30,31,32,33,34,35,36,37,38,39],
    [40,41,42,43,44,45,46,47,48,49],
    [50,51,52,53,54,55,56,57,58,59],
    [60,61,62,63,64,65,66,67,68,69],
    [70,71,72,73,74,75,76,77,78,79],
    [80,81,82,83,84,85,86,87,88,89],
    [90,91,92,93,94,95,96,97,98,99]
  ];

  stations = signal([0,33,72,49])

  path = linkedSignal(() => {
    const stations = this.stations().map(station => station.toString());
    const path = this.transportService.four_pass(stations);
    return path;
  });

  includesInPath = (cell: number): number | null => {
    const index = this.path()!.findIndex(path => path.path.includes(cell));
    return index !== -1 ? index : null;
  }

  getPathDirection(cell: number): string {
    const index = this.includesInPath(cell);
    if (index === null) return 'none';
    
    const pathSegment = this.path()![index].path;
    const cellIndex = pathSegment.indexOf(cell);
    

    if (cellIndex === 0) {

      const nextCell = pathSegment[1];
      return this.getDirectionBetweenCells(cell, nextCell);
    } 
    else if (cellIndex === pathSegment.length - 1) {

      const prevCell = pathSegment[cellIndex - 1];
      return this.getDirectionBetweenCells(prevCell, cell);
    } 
    else {

      const prevCell = pathSegment[cellIndex - 1];

      return this.getDirectionBetweenCells(prevCell, cell);
    }
  }
  

  private getDirectionBetweenCells(fromCell: number, toCell: number): string {

    const diff = toCell - fromCell;
    

    
    if (diff === 1) return 'right';
    if (diff === -1) return 'left';
    if (diff === 10) return 'down';
    if (diff === -10) return 'up';
    
    return 'none';
  }


  updateStation(index: number, value: number): void {
    const newStations = [...this.stations()];
    newStations[index] = Number(value);
    this.stations.set(newStations);
  }

  // countPathNodes = linkedSignal(() => {
  //   const path = this.path();
  //   if (!path) return 0;
  //   const uniqueNodes = new Set<number>();
  //   path.forEach(p => p.path.forEach(node => uniqueNodes.add(node)));
  //   return uniqueNodes.size;
  // });
}
