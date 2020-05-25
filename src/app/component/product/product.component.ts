import {Component, OnInit} from '@angular/core';
import {Product} from '../../model/product';
import {FilterItem} from '../../model/filterItem';
import {ProductService} from '../../service/product-service.service';
import {FilterService} from '../../service/filter-service.service';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {SelectItem} from 'primeng';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit {
  basePath = 'http://localhost:8082/products';
  inStock = true;
  products: Product[];
  filters: FilterItem[];
  queryMap: ParamMap;
  typeName: string;
  typeIds: string;

  selectedFilterMap: Map<string, string[]> = new Map<string, string[]>();
  filterKeyOnFilterName: Map<string, FilterItem> = new Map<string, FilterItem>();
  sortOptions: SelectItem[] = [
    {label: 'Цена ↑', value: 'minPrice,asc'}, {label: 'Цена ↓', value: 'minPrice,desc'},
    {label: 'Популярность ↑', value: 'rating.value,asc'}, {label: 'Популярность ↓', value: 'rating.value,desc'},
    {label: 'Отзывы ▲', value: 'reviewCount,asc'}, {label: 'Отзывы ▼', value: 'reviewCount,desc'}
  ];
  sortKey: string;

  constructor(private route: ActivatedRoute, private productService: ProductService, private filterService: FilterService) {}

  ngOnInit() {
    this.route
      .paramMap
      .subscribe(paramMap => {
        this.typeName = paramMap.get('type');
      });
    this.route.queryParamMap
      .subscribe(paramMap => {
        this.queryMap = paramMap;
        this.typeIds = this.queryMap.get('typeId');
        const requestPath = this.basePath + '?' + 'type.typeId=' + this.typeIds + '&inStock=' + this.inStock;
        this.updateProducts(requestPath);
      });
    const menuItem = this.queryMap.get('menuItem');
    this.filterService.getFilters(menuItem).subscribe(
      filters => {
        this.filters = filters;
        filters.forEach((filter: FilterItem) => {
          this.filterKeyOnFilterName.set(filter.filterKey, filter);
          let selectedArray: string[] = [];
          if (filter.filterType === 'RANGE') {
            selectedArray = filter.value;
          }
          this.selectedFilterMap.set(filter.filterKey, selectedArray);
        });
      }
    );
  }

  updateProducts(url: string) {
    this.productService.getProducts(url).subscribe(
      products => {
        this.products = products;
        console.log(this.products);
      }
    );
  }

  sendRequest() {
    this.selectedFilterMap.forEach(
      (internalFilterArr: string[], key: string) => {
        if (internalFilterArr.length === 0) {
          this.selectedFilterMap.delete(key);
        }
      }
    );

    let requestPath = this.basePath + '?';
    this.selectedFilterMap.forEach((value: string[], key: string) => {
      let intervalFlag = true;
      const currentFilterItem: FilterItem = this.filterKeyOnFilterName.get(key);
      let paramString = '';
      value.forEach((filterValue: string) => {
        paramString += filterValue;
        if (currentFilterItem.filterType === 'CHECKBOX') {
          paramString += ',';
        } else if (currentFilterItem.filterType === 'RANGE') {
          if (intervalFlag) {
            paramString += 'interval';
            intervalFlag = false;
          }
        }
      });
      if (currentFilterItem.filterType === 'CHECKBOX') {
        paramString = paramString.substring(0, paramString.length - 1);
      }
      paramString = key + '=' + paramString + '&';
      requestPath += paramString;
    });
    requestPath = requestPath.substring(0, requestPath.length - 1);
    requestPath += '&' + 'type.typeId=' + this.typeIds + '&inStock=' + this.inStock;
    this.updateProducts(requestPath);
  }

  onSortChange() {
    const url = this.basePath + '?type.typeId=' + this.typeIds + '&inStock=' + this.inStock + '&sort=' + this.sortKey;
    console.log('sortUrl=' + url);
    this.updateProducts(url);
  }
}
