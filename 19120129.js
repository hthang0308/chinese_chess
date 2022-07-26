/* Javascript JQUERY AND JQUERY UI */
/* Chinese Chess - Xianqi */
/* 
Họ và tên   : Huỳnh Minh Thắng
MSSV        : 19120129
*/
"use strict";
var width = 50; //Width of a square
var startX = 410; //Board starts from left=410
var startY = 30; //Board starts from left=410
var unitPadding = -15; //Padding so that units stay centered
var playerTurn = "red"; //Red starts first
//OnLoad - This always starts after everything is loaded
$(function () {
  drawBoard();
  createUnits();
  HistoryDotIndicator.create();
  NextMoveIndicator.create();
  CheckmateDotIndicator.create();
  for (const unit of allUnits) {
    unit.calculateNextMoves();
  }
  $(".reset").on("click", function () {
    onReset();
  });
  $(".undo").on("click", function () {
    onUndo();
  });
});
//Create Empty Board
var myBoard = [];
for (let i = 0; i <= 8; i++) {
  myBoard[i] = [];
  for (let j = 0; j <= 9; j++) {
    myBoard[i][j] = null;
  }
}
// onReset - This function is called when the reset button is clicked
function onReset() {
  HistoryDotIndicator.hide();
  for (let i = 0; i <= 8; i++) {
    myBoard[i] = [];
    for (let j = 0; j <= 9; j++) {
      myBoard[i][j] = null;
    }
  }
  for (const unit of allUnits) {
    unit.resetValue();
  }
  playerTurn = "red";
}
// onUndo - This function is called when the undo button is clicked
function onUndo() {
  boardHistory.undo();
}
//Class BoardHistory: Handles History of Board
class BoardHistory {
  constructor() {
    this.history = [];
    this.historyDot = [];
  }
  add(board) {
    var tmpBoard = [];
    for (let i = 0; i <= 8; i++) {
      tmpBoard[i] = [];
      for (let j = 0; j <= 9; j++) {
        tmpBoard[i][j] = board[i][j];
      }
    }
    this.history.push(tmpBoard);
  }
  addHistoryDot(lastPos, currentPos) {
    this.historyDot.push([lastPos, currentPos]);
  }
  undo() {
    if (this.history.length > 0) {
      var tmpBoard = this.history.pop();
      for (let i = 0; i <= 8; i++) {
        for (let j = 0; j <= 9; j++) {
          myBoard[i][j] = null;
        }
      }
      for (let i = 0; i <= 8; i++) {
        for (let j = 0; j <= 9; j++) {
          tmpBoard[i][j]?.resetValue([i, j]);
          tmpBoard[i][j]?.clearMoves();
        }
      }
      this.historyDot.pop();
      if (this.historyDot.length > 0) {
        HistoryDotIndicator.placeAt(
          this.historyDot[this.historyDot.length - 1][0],
          this.historyDot[this.historyDot.length - 1][1]
        );
      } else HistoryDotIndicator.hide();
      switchTurn();
    }
  }
}
var boardHistory = new BoardHistory();
//Create Array For Storing All Units. We will use this to reset the board to initial state.
var allUnits = [];
//Defines A New DataType For Roles Of Units
const Role = {
  king: "將",
  guard: "士",
  bishop: "象",
  knight: "馬",
  rook: "車",
  cannon: "砲",
  pawn: "卒",
};
//Switch Turn After Each Move
function switchTurn() {
  if (playerTurn === "red") playerTurn = "black";
  else playerTurn = "red";
}
//Check If XY In Board - Use In Units' Move Function
function isInBoard(pos) {
  return pos[0] >= 0 && pos[0] <= 8 && pos[1] >= 0 && pos[1] <= 9;
}
//This Singleton Function Handles How To Print Next Move Indicators To Screen. This Also Recycle Used Indicators.
var NextMoveIndicator = {
  create() {
    this.storage = [];
    //8+9 is maximum of indicators. (happens when you move Cannon or Rook)
    for (let i = 0; i < 8 + 9; i++) {
      this.storage.push($("<div></div>").hide().addClass("nextMoveIndicator").appendTo(document.body)); //push to NextMoveIndicator.storage.
    }
  },
  display(arr) {
    //move indicators to position then set it visble.
    for (const [i, val] of arr.entries()) {
      this.storage[i]
        .css({
          left: startX + val[0] * width + "px",
          top: startY + val[1] * width + "px",
        })
        .show();
    }
  },
  //clear all existing indicators by set all of them to invisible - hidden
  hide() {
    for (const val of this.storage) val.hide();
  },
};
var HistoryDotIndicator = {
  create() {
    this.dot = $("<div></div>").hide().addClass("historyDot").appendTo(document.body);
    this.bigDot = $("<div></div>").hide().addClass("historyBigDot").appendTo(document.body);
  },
  placeAt(lastPos, currentPos) {
    this.dot
      .css({
        left: startX + lastPos[0] * width + 2.75 + "px",
        top: startY + lastPos[1] * width + 2.75 + "px",
        border: "3px solid " + playerTurn,
      })
      .show();
    this.bigDot
      .css({
        left: startX + currentPos[0] * width - 17 + "px",
        top: startY + currentPos[1] * width - 17 + "px",
      })
      .show();
  },
  //clear all existing indicators by set all of them to invisible - hidden
  hide() {
    this.dot.hide();
    this.bigDot.hide();
  },
};
var CheckmateDotIndicator = {
  create() {
    this.checkmateDot = $("<div></div>").hide().addClass("checkmateDot").appendTo(document.body);
  },
  placeAt(pos) {
    this.checkmateDot
      .css({
        left: startX + pos[0] * width - 17 + "px",
        top: startY + pos[1] * width - 17 + "px",
      })
      .show();
  },
  //clear all existing indicators by set all of them to invisible - hidden
  hide() {
    this.checkmateDot.hide();
  },
};
//Class For Units. This Handles How Units Move And Its Position.
class Unit {
  constructor(color, role, pos) {
    this.color = color;
    this.role = role;
    this.pos = pos;
    this._onCreate();
    this.isActive = true;
  }
  resetValue(_pos = this._pos) {
    this.clearMoves();
    this.isActive = true;
    this.pos = _pos;
    this.element
      .addClass(this._className)
      .css({
        left: startX + unitPadding + this.pos[0] * width + "px",
        top: startY + unitPadding + this.pos[1] * width + "px",
      })
      .show();
    myBoard[this.pos[0]][this.pos[1]] = this;
  }
  //Set Unit Location And Make It Moveable. This Also Uses The this.nextMoves From Method getMoves
  //This Method Should Be Private
  _onCreate() {
    //Add unit to allUnits
    allUnits.push(this);
    //Add unit to myBoard
    myBoard[this.pos[0]][this.pos[1]] = this;
    var that = this;
    //Create element
    let tmp = $("<div></div>")
      .addClass("chessUnit " + this.color)
      .css({
        left: startX + unitPadding + this.pos[0] * width + "px",
        top: startY + unitPadding + this.pos[1] * width + "px",
      })
      .text(this.role)
      .appendTo(document.body)
      .draggable({
        start: function () {
          if (that.color === playerTurn) NextMoveIndicator.display(that.getMoves());
          tmp.css("z-index", 2);
        },
        stop: function (e, ui) {
          if (that.color === playerTurn) {
            let tmpPos = [
              Math.round((tmp.offset().left - startX - unitPadding) / width),
              Math.round((tmp.offset().top - startY - unitPadding) / width),
            ];
            let arr = that.getMoves();
            for (let i = 0; i < arr.length; i++) {
              if (arr[i][0] === tmpPos[0] && arr[i][1] === tmpPos[1]) {
                //move to new position and leave a history dot
                HistoryDotIndicator.placeAt(that.pos, tmpPos);
                boardHistory.add(myBoard);
                boardHistory.addHistoryDot(that.pos, tmpPos);
                myBoard[that.pos[0]][that.pos[1]] = null;
                that.pos = tmpPos;
                //kill enemy if overlap
                if (myBoard[that.pos[0]][that.pos[1]] !== null) myBoard[that.pos[0]][that.pos[1]].disable(); //if unit overlap with enemy, remove enemy by set it invisbile. We can then reuse this element to reset the game to the initial state.
                myBoard[that.pos[0]][that.pos[1]] = that; //assign unit to Board's new position
                //calculate all possible moves of enemy next turn
                const myAttackers = myBoard.flat().filter((unit) => unit !== null && unit.color === playerTurn);
                for (let i = 0; i < myBoard.length; i++) {
                  for (let j = 0; j < myBoard[i].length; j++) {
                    if (myBoard[i][j] !== null) {
                      myBoard[i][j].calculateNextMoves(myBoard, myAttackers);
                    }
                  }
                }

                if (canCheck(myBoard, myAttackers)) {
                  const enemyKing = myBoard
                    .flat()
                    .find((unit) => unit !== null && unit.role === Role.king && unit.color !== playerTurn);
                  CheckmateDotIndicator.placeAt([enemyKing.pos[0], enemyKing.pos[1]]);
                  $(".notification").text(`${playerTurn} checks`);
                  $(".notification").show();
                  setTimeout(() => {
                    $(".notification").hide();
                    CheckmateDotIndicator.hide();
                  }, 2000);
                } else {
                  CheckmateDotIndicator.hide();
                }
                //switch turn
                switchTurn();

                break;
              }
            }
          }
          NextMoveIndicator.hide(); //Clear indicators
          tmp.css({
            left: that.pos[0] * width + startX + unitPadding + "px",
            top: that.pos[1] * width + startY + unitPadding + "px",
            "z-index": 0,
          });
        },
      });
    //Store Base Position And Class Into "Private" Variables
    this._pos = this.pos;
    this._className = tmp.className;
    this.element = tmp;
  }
  //Disable Unit
  disable() {
    this.element.hide();
    this.isActive = false;
  }
  getMoves(board = myBoard) {
    if (!this.nextMoves) this.calculateNextMoves(board);
    if (board !== myBoard) this.calculateNextMoves(board);
    return this.nextMoves;
  }
  clearMoves() {
    this.nextMoves = undefined;
  }
  calculateNextMoves(board = myBoard, attackers) {
    this.nextMoves = [];
    let dxys = []; //dxys will store possible dx, dy
    switch (this.role) {
      case Role.king:
        dxys = [
          [-1, 0],
          [0, -1],
          [0, 1],
          [1, 0],
        ];
        for (const dxy of dxys) {
          let newPos = [this.pos[0] + dxy[0], this.pos[1] + dxy[1]];
          if (
            newPos[0] >= 3 &&
            newPos[0] <= 5 &&
            ((newPos[1] >= 0 && newPos[1] <= 2) || (newPos[1] >= 7 && newPos[1] <= 9))
          )
            this.nextMoves.push(newPos); //push into this.nextMoves
        }
        break;
      case Role.guard:
        dxys = [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ];
        for (const dxy of dxys) {
          let newPos = [this.pos[0] + dxy[0], this.pos[1] + dxy[1]];
          if (
            newPos[0] >= 3 &&
            newPos[0] <= 5 &&
            ((newPos[1] >= 0 && newPos[1] <= 2) || (newPos[1] >= 7 && newPos[1] <= 9))
          )
            this.nextMoves.push(newPos); //push into this.nextMoves
        }
        break;
      case Role.bishop:
        dxys = [
          [-2, -2],
          [-2, 2],
          [2, -2],
          [2, 2],
        ];
        for (const dxy of dxys) {
          let newPos = [this.pos[0] + dxy[0], this.pos[1] + dxy[1]];
          if (isInBoard(newPos) && (newPos[1] - 4.5) * (this.pos[1] - 4.5) > 0) {
            if (board[this.pos[0] + dxy[0] / 2][this.pos[1] + dxy[1] / 2] === null) this.nextMoves.push(newPos);
          }
        }
        break;
      case Role.knight:
        dxys = [
          [-2, -1],
          [-2, 1],
          [-1, -2],
          [-1, 2],
          [1, -2],
          [1, 2],
          [2, -1],
          [2, 1],
        ];
        for (const dxy of dxys) {
          let newPos = [this.pos[0] + dxy[0], this.pos[1] + dxy[1]];
          if (isInBoard(newPos)) {
            if (
              (dxy[0] === -2 && board[this.pos[0] - 1][this.pos[1]] === null) ||
              (dxy[1] === -2 && board[this.pos[0]][this.pos[1] - 1] === null) ||
              (dxy[0] === 2 && board[this.pos[0] + 1][this.pos[1]] === null) ||
              (dxy[1] === 2 && board[this.pos[0]][this.pos[1] + 1] === null)
            )
              this.nextMoves.push(newPos);
          }
        }
        break;
      case Role.rook: //Search 4 directions, push the first unit on the direction and everything on the way.
        for (let i = this.pos[0] + 1; i <= 8; i++) {
          if (board[i][this.pos[1]] === null) this.nextMoves.push([i, this.pos[1]]);
          else {
            if (board[i][this.pos[1]].color !== this.color) this.nextMoves.push([i, this.pos[1]]);
            break;
          }
        }
        for (let i = this.pos[0] - 1; i >= 0; i--) {
          if (board[i][this.pos[1]] === null) this.nextMoves.push([i, this.pos[1]]);
          else {
            if (board[i][this.pos[1]].color !== this.color) this.nextMoves.push([i, this.pos[1]]);
            break;
          }
        }
        for (let j = this.pos[1] + 1; j <= 9; j++) {
          if (board[this.pos[0]][j] === null) this.nextMoves.push([this.pos[0], j]);
          else {
            if (board[this.pos[0]][j].color !== this.color) this.nextMoves.push([this.pos[0], j]);
            break;
          }
        }
        for (let j = this.pos[1] - 1; j >= 0; j--) {
          if (board[this.pos[0]][j] === null) this.nextMoves.push([this.pos[0], j]);
          else {
            if (board[this.pos[0]][j].color !== this.color) this.nextMoves.push([this.pos[0], j]);
            break;
          }
        }
        break;
      case Role.cannon:
        for (let i = this.pos[0] + 1, readytoShoot = false; i <= 8; i++) {
          if (!readytoShoot) {
            if (board[i][this.pos[1]] === null) this.nextMoves.push([i, this.pos[1]]);
            else if (board[i][this.pos[1]] !== null) readytoShoot = true;
          } else if (board[i][this.pos[1]] !== null) {
            if (board[i][this.pos[1]].color !== this.color) this.nextMoves.push([i, this.pos[1]]);
            break;
          }
        }
        for (let i = this.pos[0] - 1, readytoShoot = false; i >= 0; i--) {
          if (!readytoShoot) {
            if (board[i][this.pos[1]] === null) this.nextMoves.push([i, this.pos[1]]);
            else if (board[i][this.pos[1]] !== null) readytoShoot = true;
          } else if (board[i][this.pos[1]] !== null) {
            if (board[i][this.pos[1]].color !== this.color) this.nextMoves.push([i, this.pos[1]]);
            break;
          }
        }
        for (let j = this.pos[1] + 1, readytoShoot = false; j <= 9; j++) {
          if (!readytoShoot) {
            if (board[this.pos[0]][j] === null) this.nextMoves.push([this.pos[0], j]);
            else if (board[this.pos[0]][j] !== null) readytoShoot = true;
          } else if (board[this.pos[0]][j] !== null) {
            if (board[this.pos[0]][j].color !== this.color) this.nextMoves.push([this.pos[0], j]);
            break;
          }
        }
        for (let j = this.pos[1] - 1, readytoShoot = false; j >= 0; j--) {
          if (!readytoShoot) {
            if (board[this.pos[0]][j] === null) this.nextMoves.push([this.pos[0], j]);
            else if (board[this.pos[0]][j] !== null) readytoShoot = true;
          } else if (board[this.pos[0]][j] !== null) {
            if (board[this.pos[0]][j].color !== this.color) this.nextMoves.push([this.pos[0], j]);
            break;
          }
        }
        break;
      case Role.pawn:
        let direction = 1;
        if (this.color === "red") direction = -1;
        if (isInBoard([this.pos[0], this.pos[1] + direction]))
          this.nextMoves.push([this.pos[0], this.pos[1] + direction]);
        if (direction * (this.pos[1] - 4.5) > 0) {
          if (this.pos[0] - 1 >= 0) this.nextMoves.push([this.pos[0] - 1, this.pos[1]]);
          if (this.pos[0] + 1 <= 8) this.nextMoves.push([this.pos[0] + 1, this.pos[1]]);
        }
    }
    //Remove all the this.nextMoves that collides with allies
    this.nextMoves = this.nextMoves.filter(
      (nextMove) => board[nextMove[0]][nextMove[1]] === null || board[nextMove[0]][nextMove[1]].color !== this.color
    );
    if (attackers && attackers[0].color !== this.color) {
      for (const nextMove of this.nextMoves) {
        let copyBoard = [];
        for (let i = 0; i < board.length; i++) {
          copyBoard[i] = [];
          for (let j = 0; j < board[i].length; j++) {
            copyBoard[i][j] = board[i][j];
          }
        }
        //move piece
        copyBoard[nextMove[0]][nextMove[1]] = copyBoard[this.pos[0]][this.pos[1]];
        copyBoard[this.pos[0]][this.pos[1]] = null;
        if (canCheck(copyBoard, attackers) && attackers[0].color !== this.color) {
          this.nextMoves = this.nextMoves.filter((move) => move[0] !== nextMove[0] || move[1] !== nextMove[1]);
        }
      }
    }
    return this.nextMoves;
  }
}

//This Function Creates All Units On The Board.
function createUnits() {
  new Unit("black", Role.king, [4, 0]);
  new Unit("black", Role.guard, [3, 0]);
  new Unit("black", Role.guard, [5, 0]);
  new Unit("black", Role.bishop, [2, 0]);
  new Unit("black", Role.bishop, [6, 0]);
  new Unit("black", Role.knight, [1, 0]);
  new Unit("black", Role.knight, [7, 0]);
  new Unit("black", Role.rook, [0, 0]);
  new Unit("black", Role.rook, [8, 0]);
  new Unit("black", Role.cannon, [1, 2]);
  new Unit("black", Role.cannon, [7, 2]);
  new Unit("black", Role.pawn, [0, 3]);
  new Unit("black", Role.pawn, [2, 3]);
  new Unit("black", Role.pawn, [4, 3]);
  new Unit("black", Role.pawn, [6, 3]);
  new Unit("black", Role.pawn, [8, 3]);
  new Unit("red", Role.king, [4, 9]);
  new Unit("red", Role.guard, [3, 9]);
  new Unit("red", Role.guard, [5, 9]);
  new Unit("red", Role.bishop, [2, 9]);
  new Unit("red", Role.bishop, [6, 9]);
  new Unit("red", Role.knight, [1, 9]);
  new Unit("red", Role.knight, [7, 9]);
  new Unit("red", Role.rook, [0, 9]);
  new Unit("red", Role.rook, [8, 9]);
  new Unit("red", Role.cannon, [1, 7]);
  new Unit("red", Role.cannon, [7, 7]);
  new Unit("red", Role.pawn, [0, 6]);
  new Unit("red", Role.pawn, [2, 6]);
  new Unit("red", Role.pawn, [4, 6]);
  new Unit("red", Role.pawn, [6, 6]);
  new Unit("red", Role.pawn, [8, 6]);
}
//This Function DrawBoard On Canvas
function drawBoard() {
  //Get Canvas From HTML
  var canvas = document.getElementsByTagName("canvas")[0];
  var ctx = canvas.getContext("2d");
  //Make Canvas Fullscreen
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.beginPath();
  //Orange Background
  ctx.fillStyle = "#d35400";
  ctx.fillRect(startX - width, startY - width, width * 10, width * 10 + 30);
  //Crossline
  drawCrossline(ctx, startX, startY, width);
  //Cannon Position (x4)
  drawSpecialPos(ctx, startX + width * 1, startY + width * 2, width);
  drawSpecialPos(ctx, startX + width * 7, startY + width * 2, width);
  drawSpecialPos(ctx, startX + width * 1, startY + width * 7, width);
  drawSpecialPos(ctx, startX + width * 7, startY + width * 7, width);
  //Soldier Position (x10)
  drawSpecialPos(ctx, startX + width * 0, startY + width * 3, width, 1);
  drawSpecialPos(ctx, startX + width * 2, startY + width * 3, width);
  drawSpecialPos(ctx, startX + width * 4, startY + width * 3, width);
  drawSpecialPos(ctx, startX + width * 6, startY + width * 3, width);
  drawSpecialPos(ctx, startX + width * 8, startY + width * 3, width, -1);
  drawSpecialPos(ctx, startX + width * 0, startY + width * 6, width, 1);
  drawSpecialPos(ctx, startX + width * 2, startY + width * 6, width);
  drawSpecialPos(ctx, startX + width * 4, startY + width * 6, width);
  drawSpecialPos(ctx, startX + width * 6, startY + width * 6, width);
  drawSpecialPos(ctx, startX + width * 8, startY + width * 6, width, -1);
  //King Position (x2)
  drawKingPos(ctx, startX + width * 4, startY + width * 1, width);
  drawKingPos(ctx, startX + width * 4, startY + width * 8, width);
  ctx.stroke();
}
function drawCrossline(ctx, startX, startY, width) {
  //Draw Crossline
  ctx.moveTo(startX, startY);
  ctx.lineTo(startX, startY + width * 9);
  ctx.moveTo(startX + width * 8, startY);
  ctx.lineTo(startX + width * 8, startY + width * 9);
  ctx.moveTo(startX, startY);
  ctx.lineTo(startX + width * 8, startY);
  ctx.moveTo(startX, startY + width * 9);
  ctx.lineTo(startX + width * 8, startY + width * 9);
  for (let i = 0; i < 9; i++) {
    ctx.moveTo(startX, startY + i * width);
    ctx.lineTo(startX + width * 8, startY + i * width);
  }
  for (let i = 0; i < 8; i++) {
    ctx.moveTo(startX + i * width, startY);
    ctx.lineTo(startX + i * width, startY + width * 4);
    ctx.moveTo(startX + i * width, startY + width * 5);
    ctx.lineTo(startX + i * width, startY + width * 9);
  }
}
function drawSpecialPos(ctx, x, y, width, dk = 0) {
  width = width / 10;
  if (dk >= 0) {
    let i = 1;
    for (let j = -1; j <= 1; j += 2) {
      ctx.moveTo(x + i * width * 3, y + j * width);
      ctx.lineTo(x + i * width, y + j * width);
      ctx.lineTo(x + i * width, y + j * width * 3);
    }
  }
  if (dk <= 0) {
    let i = -1;
    for (let j = -1; j <= 1; j += 2) {
      ctx.moveTo(x + i * width * 3, y + j * width);
      ctx.lineTo(x + i * width, y + j * width);
      ctx.lineTo(x + i * width, y + j * width * 3);
    }
  }
}
function drawKingPos(ctx, x, y, width) {
  ctx.moveTo(x + width, y + width);
  ctx.lineTo(x - width, y - width);
  ctx.moveTo(x + width, y - width);
  ctx.lineTo(x - width, y + width);
}
function canCheck(board, attackers) {
  const king = board
    .flat()
    .filter((unit) => unit !== null && unit.color !== attackers[0].color && unit.role === Role.king)[0];
  for (const attacker of attackers) {
    let moves = attacker.getMoves(board);
    for (const move of moves) {
      if (move[0] === king.pos[0] && move[1] === king.pos[1]) {
        console.log(
          attacker.color +
            " " +
            attacker.role +
            " at " +
            attacker.pos +
            " can check " +
            king.color +
            " " +
            king.role +
            " at " +
            king.pos
        );
        console.log(board);
        return true;
      }
    }
  }
  return false;
}
// let e = allUnits.filter((unit) => unit.color === color);
// //remove disabled units
// const myActiveUnits = myUnits.filter((unit) => unit.isActive);
// const king = myUnits.find((unit) => unit.role === Role.king);
// for (const unit of myActiveUnits) {
//   //check if my unit can attack attackers king
//   let moves = unit.getMoves();
//   for (let j = 0; j < moves.length; j++) {
//     let move = moves[j];
//     if (move[0] === king.x && move[1] === king.y) {
//       return true;
//     }
//   }
// }
// //check if my king can attack enemy king
// if (king.x !== king.x) {
//   return false;
// }
// //check if any chess between my king and enemy king
// let low_y = Math.min(king.y, king.y);
// let high_y = Math.max(king.y, king.y);
// const allActiveUnits = allUnits.filter((unit) => unit.isActive);
// for (let i = low_y + 1; i < high_y; i++) {
//   if (allActiveUnits.find((unit) => unit.x === king.x && unit.y === i)) {
//     return false;
//   }
// }
// return true;
function endTheGame(loserColor = "") {
  if (loserColor === "") {
    $(".notification").text("Draw!");
    $(".notification").show();
    setTimeout(() => {
      $(".notification").hide();
    }, 2000);
  } else {
    let winnerColor = loserColor === "red" ? "black" : "red";
    $(".notification").text(`${winnerColor} wins!`);
    $(".notification").show();
    setTimeout(() => {
      $(".notification").hide();
    }, 2000);
  }
}
