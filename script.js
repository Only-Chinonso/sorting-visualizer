const containerDiv = document.getElementById("container");
const runBtn = document.getElementById("runBtn");
const shuffleBtn = document.getElementById('shuffleBtn');
const resetBtn = document.getElementById('resetBtn');
const pauseBtn = document.getElementById('pauseBtn');
const playBtn = document.getElementById('playBtn');
const speedSelect = document.getElementById('speed');
const sizeSelect = document.getElementById('size');
const algorithmSelect = document.getElementById('algorithm');
const compCountEl = document.getElementById('compCount');
const swapCountEl = document.getElementById('swapCount');
const barCountEl  = document.getElementById('barCount');

let isPlaying = false;
let isPaused = false;
let timer = null;
let initialValues = [];
let pauseWaiters = [];

let valueCount = 50;
let minHeight = 40;
let maxHeight = containerDiv.clientHeight;
let heightDiff = (maxHeight - minHeight) / valueCount;
let runId = 0;
const algorithms = {
  heapSort, quickSort, mergeSort, insertionSort, selectionSort,
  BubbleSort, timSort, countingSort, bucketSort, bogoSort,
  radixSort, stalinSort ,perfectStalinSort
};
const algoInfo = {
  BubbleSort:    { time: "O(n²)", best: "O(n)", space: "O(1)", desc: "Repeatedly swaps adjacent out-of-order pairs until a full pass makes no swaps." },
  selectionSort: { time: "O(n²)", best: "O(n²)", space: "O(1)", desc: "Finds the smallest remaining value and swaps it into the next position." },
  insertionSort: { time: "O(n²)", best: "O(n)", space: "O(1)", desc: "Takes each value and slides it left into its place in the sorted part." },
  mergeSort:     { time: "O(n log n)", best: "O(n log n)", space: "O(n)", desc: "Splits the array in halves, sorts each, then merges them back together." },
  quickSort:     { time: "O(n log n) avg, O(n²) worst", best: "O(n log n)", space: "O(log n)", desc: "Picks a pivot, moves smaller values left and larger right, then recurses." },
  heapSort:      { time: "O(n log n)", best: "O(n log n)", space: "O(1)", desc: "Builds a max-heap, then repeatedly moves the largest value to the end." },
  timSort:       { time: "O(n log n)", best: "O(n)", space: "O(n)", desc: "Insertion-sorts small runs, then merges the runs (used by Python and Java)." },
  countingSort:  { time: "O(n + k)", best: "O(n + k)", space: "O(k)", desc: "Counts each value, then writes them back in order. No comparisons." },
  bucketSort:    { time: "O(n + k) avg, O(n²) worst", best: "O(n + k)", space: "O(n + k)", desc: "Drops values into range buckets, sorts each bucket, then joins them." },
  radixSort:     { time: "O(d·n)", best: "O(d·n)", space: "O(n + b)", desc: "Sorts digit by digit, from the least significant digit up." },
  bogoSort:      { time: "O((n+1)!)", best: "O(n)", space: "O(1)", desc: "Shuffles randomly until sorted. Please don't use this." },
  stalinSort:    { time: "O(n)", best: "O(n)", space: "O(1)", desc: "Removes any value that's out of order. Fast, but not a real sort." },
  perfectStalinSort: { time: "O(n²)", best: "O(n²)", space: "O(n)", desc: "Finds the longest increasing subsequence and removes everything else." }
};
let lastWidth = window.innerWidth;

let comparisons = 0;
let swaps = 0;

let values = [];
let container = [];

// Speed comes from <select> in the html
function getSpeed() {
  return Number(speedSelect.value);
}

function waitWhilePaused() {
  if (!isPaused) return Promise.resolve();
  return new Promise(res => pauseWaiters.push(res));
}

function releaseWaiters() {
  pauseWaiters.forEach(res => res());
  pauseWaiters = [];
}

function sleep(ms) {
  updateCounters();
  const id = runId;
  return new Promise((resolve, reject) =>
    setTimeout(async () => {
      await waitWhilePaused();
      if (id === runId) resolve();
      else reject("cancelled");
    }, ms * getSpeed() / 10));
}

function stopPlaying() {
  runId++;
  isPlaying = false;
  isPaused = false;
  releaseWaiters();
  updateButtons();
  updateCounters();
}

function updateCounters() {
  compCountEl.textContent = comparisons;
  swapCountEl.textContent = swaps;
}

function resetCounters() {
  comparisons = 0;
  swaps = 0;
  updateCounters();
}

function updateInfo() {
  const info = algoInfo[algorithmSelect.value];
  if (!info) return;
  document.getElementById('algoTime').textContent  = "Time: "  + info.time;
  document.getElementById('algoBest').textContent  = "Best: "  + info.best;
  document.getElementById('algoSpace').textContent = "Space: " + info.space;
  document.getElementById('algoDesc').textContent  = info.desc;
}

function shuffle() {
  stopPlaying();
  resetCounters();
  initValues();
  initContainer();
}

function reset() {
  stopPlaying();
  resetCounters();
  values = [...initialValues];
  initContainer();
}
function updateButtons() {
  playBtn.classList.toggle('active', isPlaying && !isPaused);
  pauseBtn.classList.toggle('active', isPlaying && isPaused);
}

function initValues() {
  maxHeight = containerDiv.clientHeight;
  heightDiff = (maxHeight - minHeight) / valueCount;
  values = [];
  for (let i = 0; i < valueCount; i++) {
    values.push(Math.round(minHeight + i * heightDiff));
  }
  for (let i = values.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  initialValues = [...values]; // save for Reset
}

function initContainer() {
  container = [];
  containerDiv.innerHTML = "";
  for (let v of values) {
    let bar = document.createElement("div");
    bar.classList.add("bar");
    bar.style.height = v + "px";
    container.push(bar);
    containerDiv.appendChild(bar);
  }
}

async function runAlgorithm() {
  if (isPlaying) return;
  const fn = algorithms[algorithmSelect.value];
  if (!fn) return console.warn("Unknown algorithm:", algorithmSelect.value);

  const id = runId;
  isPlaying = true;
  updateButtons();
  removeClass("sorted", "comparing", "swapped");
  resetCounters();
  try {
    await fn();
    await sorted();
  } catch (e) {
    if (e !== "cancelled") throw e;
  } finally {
    if (id === runId) {
      isPlaying = false;
      updateButtons();
    }
  }
}

// --- BUTTONS ---

runBtn.onclick = runAlgorithm;

shuffleBtn.onclick = () => {
  shuffle();
};
playBtn.onclick = () => {
  if (isPaused) {
    isPaused = false;
    releaseWaiters();
    updateButtons();
  } else {
    runAlgorithm();
  }
};

pauseBtn.onclick = () => {
  if (!isPlaying || isPaused) return;
  isPaused = true;
  updateButtons();
};
resetBtn.onclick = () => {
  reset();
};

sizeSelect.onchange = () => {
  valueCount = Number(sizeSelect.value);
  heightDiff = (maxHeight - minHeight) / valueCount;
  shuffle();
};

algorithmSelect.onchange = updateInfo;

window.addEventListener('resize', () => {
  if (window.innerWidth === lastWidth) return;  // height-only change: ignore
  lastWidth = window.innerWidth;
  maxHeight = containerDiv.clientHeight;
  heightDiff = (maxHeight - minHeight) / valueCount;
  shuffle();
});

function removeClass(...names) {
  document.querySelectorAll('.bar').forEach(bar => {
    bar.classList.remove(...names);
  });
}
async function sorted() {
  removeClass("swapped","comparing");
  for (let bar of container) {
    await sleep(50);
    bar.classList.add("sorted");
  }
}

// --- ALGORITHMS ---
async function BubbleSort() {
  let done = false;
  while (!done) {
    done = true;
    for (let i = 1; i < values.length; i++) {
      let j = i-1;
      removeClass("comparing","swapped");
      container[i].classList.add("comparing");
      container[j].classList.add("comparing");
      comparisons++;
      await sleep(10);
      if (values[j] > values[i]) {
        swaps++;
        done = false;
        let valueJ = values[j];
        let valueI = values[i];
        container[i].style.height = valueJ + "px";
        container[j].style.height = valueI + "px";
        [values[j],values[i]] = [values[i],values[j]];
        container[i].classList.add("swapped");
        container[j].classList.add("swapped");
      }
      await sleep(10);
    }
  }
}

async function selectionSort() {
  let j = 0;
  while (j < values.length) {
    //find the smallest so far 
    let s = j;//the smallest value index so far
    for (let i = j+1; i < values.length; i++) {
      removeClass("comparing","swapped");
      container[i].classList.add("comparing");
      container[s].classList.add("comparing");
      let curVal = values[i];
      comparisons++;
      await sleep(10)
      if (curVal < values[s]) {
        s = i;
      }
    }
    //swap it to the value at j
    container[s].classList.add("swapped");
    container[j].classList.add("swapped");
    container[s].style.height = values[j] + "px";
    container[j].style.height = values[s] + "px";
    [values[j],values[s]] = [values[s],values[j]];
    swaps++;
    j++;
    await sleep(10)
  }
}

async function insertionRange(start, end) {
  for (let j = start + 1; j < end; j++) {
    let cur = values[j];
    let k = j - 1;
    while (k >= start && cur < values[k]) {
      removeClass("comparing", "swapped");
      container[k].classList.add("comparing");
      container[k + 1].classList.add("comparing");
      comparisons++;
      await sleep(10);
      container[k + 1].style.height = values[k] + "px";
      values[k + 1] = values[k];
      swaps++;
      k--;
    }
    container[k + 1].classList.add("swapped");
    container[j].classList.add("swapped");
    container[k + 1].style.height = cur + "px";
    values[k + 1] = cur;
    if (k + 1 !== j) swaps++;
    await sleep(10);
  }
}

function insertionSort() { return insertionRange(0, values.length); }

async function mergeSort() {
  await mergeSortRange(0, values.length - 1);
  
  async function mergeSortRange(left, right) {
    if (left >= right) return; //1 element (already sorted)
    
    let mid = Math.floor((left + right) / 2);
    
    //sort left half
    await mergeSortRange(left, mid);
    
    //sort right half
    await mergeSortRange(mid + 1, right);
    
    //merge them
    await mergeRange(left, mid, right);
  }
}
async function mergeRange(left, mid, right) {
  let leftPart = values.slice(left, mid + 1);
  let rightPart = values.slice(mid + 1, right + 1);

  let i = 0;
  let j = 0;
  let k = left;

  while (i < leftPart.length && j < rightPart.length) {
    removeClass("comparing", "swapped");
    container[left + i].classList.add("comparing");
    container[mid + 1 + j].classList.add("comparing");
    comparisons++;
    await sleep(10);

    if (leftPart[i] <= rightPart[j]) {
      swaps++;
      values[k] = leftPart[i];
      i++;
    } else {
      swaps++;
      values[k] = rightPart[j];
      j++;
    }
    container[k].style.height = values[k] + "px";
    container[k].classList.add("swapped");
    k++;
  }

  // copy whatever is left
  while (i < leftPart.length) {
    values[k] = leftPart[i];
    container[k].style.height = values[k] + "px";
    container[k].classList.add("swapped");
    swaps++;
    await sleep(10);
    i++;
    k++;
  }
  while (j < rightPart.length) {
    swaps++;
    values[k] = rightPart[j];
    container[k].style.height = values[k] + "px";
    container[k].classList.add("swapped");
    await sleep(10);
    j++;
    k++;
  }
}

async function quickSort() {

  async function recursion(arr, start) {
    if (arr.length <= 1) return arr

    let pivot = arr[arr.length - 1];
    let j = -1;
    
    for (let i = 0; i < arr.length - 1; i++) {
      removeClass("comparing", "swapped");
      container[start + i].classList.add("comparing");
      container[start + arr.length - 1].classList.add("comparing"); // pivot
      comparisons++;
      await sleep(10);

      if (arr[i] < pivot) {
        j++;
        let temp = arr[j];
        arr[j] = arr[i];
        arr[i] = temp;

        container[start + j].style.height = arr[j] + "px";
        container[start + i].style.height = arr[i] + "px";
        container[start + j].classList.add("swapped");
        container[start + i].classList.add("swapped");
        swaps++;
        await sleep(30);
      }
    }
    
    j++;
    let temp = arr[j];
    arr[j] = arr[arr.length - 1];
    arr[arr.length - 1] = temp;

    // draw final pivot swap
    container[start + j].style.height = arr[j] + "px";
    container[start + arr.length - 1].style.height = arr[arr.length - 1] + "px";
    container[start + j].classList.add("swapped");
    swaps++;
    await sleep(50);

    let leftSide = arr.slice(0, j);
    let rightSide = arr.slice(j + 1);

    let sortedLeft = await recursion(leftSide, start);
    let sortedRight = await recursion(rightSide, start + j + 1);
    
    return [...sortedLeft, pivot, ...sortedRight]
  }

  values = await recursion(values, 0);
}

async function heapSort() {
  async function heapify(length, i) {
    let biggest = i;
    let l = 2 * i + 1;// left children 
    let r = 2 * i + 2;// right children 

    if (l < length) {
      container[l].classList.add("comparing");
      container[biggest].classList.add("comparing");
      comparisons++;
      await sleep(10);
      if (values[l] > values[biggest]) {
        biggest = l;
      }
      removeClass("comparing");
    }
    if (r < length) {
      container[r].classList.add("comparing");
      container[biggest].classList.add("comparing");
      comparisons++;
      await sleep(10);
      if (values[r] > values[biggest]) {
        biggest = r;
      }
      removeClass("comparing");
    }
    // if child is bigger than parent swap the child with the parent
    if (biggest !== i) {
      let temp = values[biggest];
      values[biggest] = values[i];
      values[i] = temp;

      container[i].style.height = values[i] + "px";
      container[biggest].style.height = values[biggest] + "px";
      container[i].classList.add("swapped");
      container[biggest].classList.add("swapped");
      swaps++;
      await sleep(20);
      removeClass("swapped");

      await heapify(length, biggest);
    }
  }

  // build max heap
  for (let i = Math.floor(values.length / 2) - 1; i >= 0; i--) {
    await heapify(values.length, i);
  }

  // swap the first with the last value, then shrink the array
  for (let i = values.length - 1; i > 0; i--) {
    let temp = values[0];
    values[0] = values[i];
    values[i] = temp;

    container[0].style.height = values[0] + "px";
    container[i].style.height = values[i] + "px";
    container[0].classList.add("swapped");
    container[i].classList.add("swapped");
    swaps++;
    await sleep(20);
    removeClass("swapped");

    await heapify(i, 0);
  }
}

async function timSort() {
  //calculate minRun
  let n = values.length;
  let remainder = 0;
  while (n > 64) {
    remainder = remainder || n % 2;
    n = Math.floor(n/2);
  }
  let minRun = n + remainder;
  
  //sort every run with insertion sort
  for (let i = 0; i < values.length; i+= minRun) {
    let left = i;//first index of the cur run
    let right = Math.min(i+minRun,values.length);//last
    await insertionRange(left,right);
  }
  
  //merge the runs
  for (let size = minRun; size < values.length; size*=2) {
    for (let left = 0; left < values.length; left+=size*2) {
      let mid = left + size-1;
      let right = Math.min(left+size*2-1, values.length-1);
      if (right > mid) {
        await mergeRange(left, mid, right);
      }
    }
  }
}

async function countingSort() {
  let buckets = [];
  
  //fill buckets
  for (let i = 0; i < values.length; i++) {
    let value = values[i];
    
    if (buckets[value]) {
      buckets[value].push(value);
    }
    else{
      buckets[value] = [value];
    }
    container[i].classList.add("comparing");
    await sleep(100);
    removeClass("comparing");
  }
  
  //sort
  let k = 0;
  for (let i = 0; i < buckets.length; i++) {
    if (!buckets[i]) continue
    for (let j = 0; j < buckets[i].length; j++) {
      values[k] = buckets[i][j];
      container[k].style.height = buckets[i][j] + "px";
      container[k].classList.add("swapped");
      swaps++;
      await sleep(100);
      removeClass("swapped");
      k++;
    }
  }
}

async function bucketSort() {
  let bucketCount = 40;
  let maxValue = Math.max(...values);
  let buckets = Array.from({ length: bucketCount }, () => []);

  // fill buckets
  for (let i = 0; i < values.length; i++) {
    let v = values[i];
    let index = Math.floor((v / maxValue) * (bucketCount - 1));
    buckets[index].push(v);

    container[i].classList.add("comparing");
    
    await sleep(100);
    removeClass("comparing");
  }

  // sort every bucket using insertion sort
  for (let bucket of buckets) {
    for (let i = 1; i < bucket.length; i++) {
      let cur = bucket[i];
      let k = i - 1;
      while (k >= 0 && bucket[k] > cur) {
        bucket[k + 1] = bucket[k];
        k--;
      }
      bucket[k + 1] = cur;
    }
  }

  // put back using the buckets we filled and sorted
  let k = 0;
  for (let bucket of buckets) {
    for (let v of bucket) {
      values[k] = v;
      container[k].style.height = v + "px";
      container[k].classList.add("swapped");
      swaps++;
      await sleep(100);
      removeClass("swapped");
      k++;
    }
  }
}

async function radixSort() {
  let maxValue = Math.max(...values);
  let maxLength = String(maxValue).length;

  for (let i = 0; i < maxLength; i++) {
    let buckets = Array.from({ length: 10 }, () => []);
    // fill the buckets
    for (let j = 0; j < values.length; j++) {
      let value = values[j];
      let cur = Math.floor(value / Math.pow(10, i)) % 10;
      buckets[cur].push(value);

      // highlight the bar we're putting in a bucket
      container[j].classList.add("comparing");
      await sleep(5);
      removeClass("comparing");
    }

    // empty out the buckets
    let k = 0;
    for (let bucket of buckets) {
      for (let value of bucket) {
        swaps++;
        values[k] = value;
        container[k].style.height = value + "px";
        container[k].classList.add("swapped");
        k++;
      }
    }

    await sleep(50);
    removeClass("swapped");
  }
}

async function bogoSort() {
  function isSorted() {
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > values[i]) return false;
    }
    return true;
  }
  //sort it random and check if it sorted
  while (!isSorted()) {
    for (let i = values.length-1; i >= 0; i--) {
      let j = Math.floor(Math.random()*(i+1));
      [values[i], values[j]] = [values[j], values[i]];
      container[j].style.height = values[j] + "px";
      container[i].style.height = values[i] + "px";
      container[i].classList.add("swapped");
      container[j].classList.add("swapped");
      swaps++;
    }
    await sleep(50);
    removeClass("swapped");
  }
}

async function stalinSort() {
  for (let i = 1; i < values.length; i++) {
    container[i].classList.add("comparing");
    container[i-1].classList.add("comparing");
    comparisons++;
    await sleep(20);
    container[i].classList.remove("comparing");
    container[i-1].classList.remove("comparing");

    if (values[i-1] > values[i]) {
      container[i].classList.add("swapped");
      swaps++;
      await sleep(50);

      container[i].remove(); // remove from screen
      container.splice(i, 1); // remove from div array
      values.splice(i, 1); // remove from values array
      barCountEl.textContent = values.length;
      i--;
    }
  }
}

async function perfectStalinSort() {
  async function getLIs(arr) {
    let dp = Array(arr.length).fill(1); //every number is length 1
    let prev = Array(arr.length).fill(-1); //the index way i came from 
    let maxLength = 1;
    let maxIndex = 0;
    for (let i = 1; i < arr.length; i++) {
      for (let j = 0; j < i; j++) {
        if (arr[j] <= arr[i] && dp[j]+1 > dp[i]) {
          dp[i] = dp[j]+1;
          prev[i] = j;
        }
        if (dp[i] > maxLength) {
          maxLength = dp[i];
          maxIndex = i;
        }
        container[i].classList.add("comparing");
        container[j].classList.add("comparing");
        comparisons++;
        await sleep(10);
        removeClass("comparing");
      }
    }
    
    let cur = maxIndex;
    let lis = new Set();
    while (cur !== -1) {
      lis.add(cur);
      cur = prev[cur];
    }
    return lis
  }
  
  let keep = await getLIs(values);
  for (let i = values.length-1; i >= 0; i--) {
    if (!keep.has(i)) {
      container[i].classList.add("swapped");
      swaps++;
      await sleep(50);
      removeClass("comparing");
      container[i].remove();
      values.splice(i,1);
      container.splice(i,1);
      barCountEl.textContent = values.length;
    }
  }
}

updateInfo();
shuffle();