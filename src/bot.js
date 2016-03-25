//configuration vars
var Maxbet = 0;
var Startbet = 0;
var FirstColor = 'r';
var AutoStopOn = 0;
var Method = 1;
var AutoReconnect = true;

//import dom objects
var betAmount = document.getElementById('betAmount');
var redBetBtn = document.getElementsByClassName("betButton")[0];
var greenBetBtn = document.getElementsByClassName("betButton")[1];
var blackBetBtn = document.getElementsByClassName("betButton")[2];
var balance = document.getElementById('balance');
var banner = document.getElementById('banner');

//control vars
var sCurrentBetColor = ''; //cor atual que será apostada
var sLastWinColor = ''; //ultima cor a ganhar
var iCurrentBet = 0; //valor da aposta atual
var iLooseStreak = 0; //perdas consecutivas
var iWinStreak = 0; //vitorias consecutivas
var iBets = 0; //numero de apostas
var iWins = 0; //numero de vitorias
var iLosts = 0; //nomero de perdas
var iLastBetValue = 0; //valor da ultima aposta
var bBetTime = false; //se o site esta aceitando as apostas
var Start = false; //toggle pelo StartStopBot
var iStartBalance = 0; //balanço inicial
var bWinLastRound = false; //se ganhou a ultima bet
var iCurrentStatus = 0; //Round atual do CSGODouble
var iRecentBets = 0;
var PossibleBets = ['r', 'b'];

//enum
RolletStatus =
{
  CountDown : 1,
  Confirming : 2,
  Rolling : 3,
  Rolled : 4
}

BetSystem =
{
  Random : 0,
  Martin : 1,
  interweaving : 3
}

//main LOOP
setInterval(function()
{
  if(!Start)
    return;

  getStatus();

  if(iStartBalance == 0)
    iStartBalance = getBalance();

  if(Startbet <= 0)
  {
    log("Defina um valor incial para aposta escrevendo no console: Startbet = *valor*");
    return;
  }

  if(sCurrentBetColor == '')
    sCurrentBetColor = FirstColor;

  if(iCurrentBet == 0)
    iCurrentBet = Startbet;

  if(bBetTime)
    bet();

}, 1000);

//misc functions
function bet()
{
  bBetTime = false;

  log("Apostando " + iCurrentBet + " na cor " + sCurrentBetColor);

  if(getBalance() < iCurrentBet)
  {
    log("Você não tem moedas suficientes para essa aposta");
  }
  else if(sCurrentBetColor != '' && iCurrentBet > 0)
  {
      iBets++;
      betAmount.value = iCurrentBet;

      if(sCurrentBetColor == 'r')
        redBetBtn.click();
      else if(sCurrentBetColor == 'g')
        greenBetBtn.click();
      else if(sCurrentBetColor == 'b')
        blackBetBtn.click();
  }
  else
  {
    log("Cor ou aposta não identificada");
  }
}

function log(string)
{
  console.log("[CSGOBot] " + string);
}

function getBalance()
{
  if(!isNaN(balance.innerHTML))
    return balance.innerHTML;
  else
    return 0;
}

function StartStopBot()
{
  Start = !Start;
}

function resume()
{
  log("---------------------");
  log("Total de apostas: " + iBets);
  log("Total de vitorias: " + iWins);
  log("Totas de derrotas: " + iLosts);
  log("Networth inicial: " + iStartBalance);
  log("Networth final: " + getBalance() + " (" + (getBalance() - iStartBalance).toString() + ")");
  log("---------------------");
}

function commands()
{
  log("---------------------");
  log("resume() - Mostra o resumo das apostas realizadas pelo bot nesta sessão");
  log("StartStopBot() - Toggle do bot")
  log("Maxbet - Seta o valor maximo de uma aposta (valor inteiro)");
  log("Startbet - Valor da primeira aposta (valor inteiro)");
  log("FirstColor - primeira cor que o bot deve apostar ('r', 'g', 'b')");
  log("AutoStopOn - Parar após perdas consecutivas");
  log("Method - Escolhe o metodo de apostas (Martin, interweaving, random)");
  log("-- |BetSystem.Martin - Muda para a cor que ganhou quando perder")
  log("-- |BetSystem.interweaving - Aposta 2x em cada cor, não importa o resultado");
  log("-- |BetSystem.random - Escolhe randomicamente a proxima cor")
  log("AutoReconnect (true, false)");
  log("---------------------");
}

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function getStatus()
{
  var str = banner.innerHTML;
  var result = "";

  if(str.indexOf("Rolling in") > -1 && iCurrentStatus != RolletStatus.CountDown)
  {
    bBetTime = true;
    iCurrentStatus = RolletStatus.CountDown;
    //log("Counting down..");
  }
  else if(str.indexOf("Confirming") > -1 && iCurrentStatus != RolletStatus.Confirming)
  {
    iCurrentStatus = RolletStatus.Confirming;
    bBetTime = false;
    //log("Confirming..");
  }
  else if(str.indexOf("ROLLING") > -1 && iCurrentStatus != RolletStatus.Rolling)
  {
    iCurrentStatus = RolletStatus.Rolling;
    bBetTime = false;
    //log("Rolling..");
  }
  else if(str.indexOf("CSGODouble rolled") > -1 && iCurrentStatus != RolletStatus.Rolled)
  {
    result = str.match(/\d+/)[0];

    if(result >= 1 && result <= 7)
      sLastWinColor = 'r';
    else if(result >= 8 && result <= 14)
      sLastWinColor = 'b';
    else if(result == 0)
      sLastWinColor = 'g';

    if(sLastWinColor == sCurrentBetColor)
    {
      bWinLastRound = true;
      iCurrentBet = Startbet;

      log("Você ganhou!");
      iLooseStreak = 0;
      iWins++;
    }
    else
    {
      bWinLastRound = false;
      iCurrentBet = iCurrentBet * 2;
      iLooseStreak++;

      if(iCurrentBet > Maxbet && Maxbet > 0)
        iCurrentBet = Maxbet;

      log("Você perdeu :(");

      if(iLooseStreak >= AutoStopOn && AutoStopOn > 0)
      {
        log("Você perdeu " + iLooseStreak + " em seguida, autostop ativado.");
        Start = false;
      }

      iLosts++;
    }

    switch(Method)
    {
      case BetSystem.Random:
        sCurrentBetColor = PossibleBets[randomIntFromInterval(0,1)];
      break;
      case BetSystem.Martin:
        sCurrentBetColor = (sLastWinColor != 'g' && sCurrentBetColor != sLastWinColor) ? sLastWinColor : (sLastWinColor == 'g') ? FirstColor : FirstColor;
      break;
      case BetSystem.interweaving:
        if(iRecentBets >= 1)
        {
          sCurrentBetColor = (sCurrentBetColor == 'r') ? 'b' : 'r';
          iRecentBets = 0;
        }

        iRecentBets++;
      break;
    }

    iCurrentStatus = RolletStatus.Rolled;
    bBetTime = false;
    //log("End onf round");
  }
}
