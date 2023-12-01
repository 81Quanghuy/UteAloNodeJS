class PaginationInfo {
  constructor(page, pages, count, itemsPerPage) {
    this.page = page;
    this.pages = pages;
    this.count = count;
    this.itemsPerPage = itemsPerPage;
  }
}

module.exports = PaginationInfo;
