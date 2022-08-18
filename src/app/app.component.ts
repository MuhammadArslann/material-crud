import * as XLSX from 'xlsx'; 
import { Component, ViewChild, OnInit, Inject, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './components/dialog/dialog.component';
import { ApiService } from './shareable/api.service';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import {SelectionModel} from '@angular/cdk/collections';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'material-crud';
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  selection = new SelectionModel<any>(true, []);
  displayedColumns: string[] = ['select','id','productName', 'category', 'date', 'freshness', 'price', 'comment', 'action'];
  dataSource!: MatTableDataSource<any>;
 // Excel report generator code
  @ViewChild('TABLE', { static: false }) TABLE!: ElementRef;   
  ExportTOExcel() {  
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(this.TABLE.nativeElement); 
    delete (ws['13'])
    const wb: XLSX.WorkBook = XLSX.utils.book_new();  
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');  
    XLSX.writeFile(wb, 'Report.xlsx');  
  }

  constructor(private dialog: MatDialog, private apiService: ApiService, private snackBar: MatSnackBar){}

  ngOnInit(): void {
    this.getAllProduct();
  }
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }
  toggle(row: any) {
    this.selection.toggle(row);
    console.log(this.selection.selected);
    this.selection.selected
    
  }
  masterToggle(event: any) {
    if(this.isAllSelected()){
      this.selection.clear();
    } else {
      this.selection.select(...this.dataSource.data)
    }
    console.log(this.selection.selected);    
  }
  openDialog() {
    this.dialog.open(DialogComponent, {
    }).afterClosed().subscribe(val => {
      if(val === 'save'){
        this.getAllProduct();
      }
    })
  }
  removeSelectedRows() {
    this.selection.selected.forEach(item => {
      let index: number = this.selection.selected.findIndex(d => d === item.id);
     // this.dataSource.data.splice(index,1)
      this.deleteProduct(index); 
      this.dataSource = new MatTableDataSource<Element>(this.dataSource.data);
    });
    this.selection = new SelectionModel<Element>(true, []);
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action);
  }
  editProduct(row: any){
    this.dialog.open(DialogComponent, {
     data: row
    }).afterClosed().subscribe(val => {
      if(val === 'update'){
        this.getAllProduct();
      }
    })
  }
  deleteProduct(id: number){
    this.apiService.deleteProduct(id)
    .subscribe({
      next: (res) => {
        this.openSnackBar('Product Deleted Successfully', 'Dismiss')
        this.getAllProduct();
      },
      error: () => {
        this.openSnackBar("Product didn't deleted successfully.", 'Dismiss')
      }
    })
  }
  getAllProduct(){
    this.apiService.getProduct().subscribe({
      next: (res) => {
       this.dataSource = new MatTableDataSource(res);
       this.dataSource.paginator = this.paginator;
       this.dataSource.sort = this.sort;
      }, error: (err) => alert("Data not fetched!")
    })
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
