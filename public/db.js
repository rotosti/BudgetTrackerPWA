let database;
let version;

const request = indexeddatabase.open('BudgetDatabase', version || 16);

request.onupgradeneeded = function (e) {
  console.log('Upgrade needed in Indexdatabase');

  const { oldVersion } = e;
  const newVersion = e.newVersion || database.version;

  console.log(`DB version update ${oldVersion} to ${newVersion}`);

  database = e.target.result;

  if (database.objectStoreNames.length === 0) {
    database.createObjectStore('BudgetStore', { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`ERROR ${e.target.errorCode}`);
};

function checkDatabase() {

  let transaction = database.transaction(['BudgetStore'], 'readwrite');

  const store = transaction.objectStore('BudgetStore');

  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            
            transaction = database.transaction(['BudgetStore'], 'readwrite');

            const currentStore = transaction.objectStore('BudgetStore');

            currentStore.clear();
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  
  database = e.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

const saveRecord = (record) => {
  
  const transaction = database.transaction(['BudgetStore'], 'readwrite');

  const store = transaction.objectStore('BudgetStore');

  store.add(record);
};

window.addEventListener('online', checkDatabase);