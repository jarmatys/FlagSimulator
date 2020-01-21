//globalny obiekt siatki 
let flag;

//współczynniki siatki
let kRatio = 0.016;
let gravityX = 400;
let gravityY = 0;
let matrix_height = 40;
let matrix_width = 60;

let mouse = {
    down: false,
    x: 0,
    y: 0,
    px: 0,
    py: 0
};

// ----------------- klasa Point --------------------

let Point = function (x, y) {

    //współrzędnie siatki
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;

    //prędkości punktów
    this.vx = 0;
    this.vy = 0;

    //ustalamy czy punkty są przypięte
    this.pin_x = null;
    this.pin_y = null;

    //lista zależności pomiędzy punktami
    this.constraints = [];
};

Point.prototype.update = function (kRatio) {

    //sprawdzamy czy przycisk myszy jest trzymany
    if (mouse.down) {

        let diff_x = this.x - mouse.x;
        let diff_y = this.y - mouse.y;

        //liczymy na jaki dystans działa kliknięcie myszki
        let distance = Math.sqrt(diff_x * diff_x + diff_y * diff_y);

        //ruszamy tylko te elementy które są w odległości 10 pixeli od kliknięcia myszki
        if (distance < 10) {
            this.px = this.x - (mouse.x - mouse.px) * 2;
            this.py = this.y - (mouse.y - mouse.py) * 2;
        }
    }

    //nadajemy siły na flagę
    let randomForce = Math.floor(Math.random() * 6000) - 3000;
    this.addForce(gravityX, randomForce);

    //algorytm verleta
    //aktualna pozycja - poprzednia pozycja * siła 
    VerletX = this.x + (this.x - this.px) + ((this.vx / 2) * Math.pow(kRatio, 2));
    VerletY = this.y + (this.y - this.py) + ((this.vy / 2) * Math.pow(kRatio, 2));

    this.px = this.x;
    this.py = this.y;

    this.x = VerletX;
    this.y = VerletY;

    this.vy = 0;
    this.vx = 0;
};

//rysowanie punktów
Point.prototype.draw = function () {

    let constraintsLength = this.constraints.length;
    for (let i = constraintsLength; i > 0; i--) {
        this.constraints[i - 1].draw();
    }

};

//sprawdzanie zaleznosci pomiędzy punktami
Point.prototype.calculate_constraints = function () {

    //jeżeli punkty są ustawione jako szytwne to wyjdź i zostaw ich lokalizacje
    if (this.pin_x != null && this.pin_y != null) {
        this.x = this.pin_x;
        this.y = this.pin_y;
        return;
    }

    //jeżeli punkty są ustawione jako ruchome 
    let constraintsLength = this.constraints.length;
    for (let i = constraintsLength; i > 0; i--) {
        this.constraints[i - 1].calculate();
    }

};

//dodawnie siły dla punktów siatki
Point.prototype.addForce = function (x, y) {

    this.vx += x;
    this.vy += y;

    //dodajemy zaokrąglone siły po x i y na każdy z punktów
    this.vx = (this.vx * 1000) / 1000;
    this.vy = (this.vy * 1000) / 1000;

};

//metoda odpowiedzalna za tworzenie powiązań między punktami siatki
Point.prototype.addPin = function (point) {
    this.constraints.push(
        new Constraint(this, point)
    );
};

//metoda odpowiedzalna za przypięcie danego punktu na sztywno
Point.prototype.frozePin = function (pinx, piny) {
    this.pin_x = pinx;
    this.pin_y = piny;
};

//------------klasa Constraint-------------------------

//obiekt określający połączenia między elementami siatki
let Constraint = function (p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = 10;
};

//liczenie przemieszczenia miedzy kwadratami na siatce
Constraint.prototype.calculate = function () {

    let diff_x = this.p1.x - this.p2.x;
    let diff_y = this.p1.y - this.p2.y;

    let dist = Math.sqrt(diff_x * diff_x + diff_y * diff_y);
    let diff = (this.length - dist) / dist

    let px = diff_x * diff * 0.5;
    let py = diff_y * diff * 0.5;

    this.p1.x += px;
    this.p1.y += py;
    this.p2.x -= px;
    this.p2.y -= py;
};

//rysowanie policzonych kwadratów wraz z ich nową lokalizacją
Constraint.prototype.draw = function () {
    ctx.moveTo(this.p1.x, this.p1.y);
    ctx.lineTo(this.p2.x, this.p2.y);
};

// ------------klasa Flagi-----------------------------

let Flag = function () {
    //lista punktów siatki
    this.points = [];

    //obliczam punkt z którego staruję rysować pojedyńcze elementy siatki
    let start_x = canvas.width / 2 - matrix_width * 10 / 2;

    //dwie pętle do wypełnenia siatki w kolumnach i rzędach
    for (let y = 0; y <= matrix_height; y++) {
        for (let x = 0; x <= matrix_width; x++) {

            //tworzymy obiekt point, którzy przyjmuje pozycję punktu
            let point = new Point(start_x + x * 10, 20 + y * 10);

            //przyczepiamy point do poprzedniego po x i y, chyba że jest już na krawędzi
            if (x != 0) {
                point.addPin(this.points[this.points.length - 1]);
            }

            if (y != 0) {
                point.addPin(this.points[x + (y - 1) * (matrix_width + 1)]);
            }

            //punkty na stywno to sa wszystkie punkty których x jest w pierwszej kolumnie
            if (x == 0) {
                point.frozePin(point.x, point.y);
            }


            this.points.push(point);
        }
    }
};

//metoda do aktualizowania właściwości siatki
Flag.prototype.update = function () {

    //pętla po wszystkich pointach w siatce, która sprawdza powiązania
    let points = this.points.length;
    for (let i = points; i > 0; i--) {
        this.points[i - 1].calculate_constraints();
    }

    //pętla po wszystkich punktach, która aktualizuje ich wartości
    for (let i = points; i > 0; i--) {
        this.points[i - 1].update(kRatio);
    }

};

//metoda do rysowania siatki
Flag.prototype.draw = function () {
    ctx.beginPath();

    //rysujemy flagę
    let points = flag.points.length;
    for (let i = points; i > 0; i--) {
        this.points[i - 1].draw();
    }

    ctx.stroke();
};

// --------------------- Główne funckcje startujące i updatujące -----------------

function update() {

    //Czyszczę obszar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //aktualizuję i rysuję siatkę
    flag.update();
    flag.draw();
}

function start() {

    //rejestrowanie czy klawisz myszy jest wciśnięta i rejestruje jej ruchy
    canvas.onmousedown = function (e) {

        mouse.px = mouse.x;
        mouse.py = mouse.y;

        let rect = canvas.getBoundingClientRect();

        //przypisywanie pozycji myszki do obiektu mouse
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;

        mouse.down = true;

        e.preventDefault();
    };

    //rejestrowanie ze myszka odbiła i już nie ciągnie materiału
    canvas.onmouseup = function (e) {
        mouse.down = false;
        e.preventDefault();
    };

    //rejestrowanie ruchu myszki
    canvas.onmousemove = function (e) {
        mouse.px = mouse.x;
        mouse.py = mouse.y;

        let rect = canvas.getBoundingClientRect();

        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        e.preventDefault();
    };

    canvas.oncontextmenu = function (e) {
        e.preventDefault();
    };

    //ustawiamy kolor siatki
    ctx.strokeStyle = '#000';

    flag = new Flag();

    update();
}

//------------------- Załadowanie DOM ------------------------

window.onload = function () {

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.9;

    start();

    //ustawiamy interwał odswieżający ruch siatki
    window.setInterval(update, 5);
};