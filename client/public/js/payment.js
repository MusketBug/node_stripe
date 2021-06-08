var stripe = Stripe("xx_xxx_xxx")
var elements = stripe.elements();

// 注文情報、サーバではこのJSONを受け取って処理を行う
var order = {
    items:[
        {
            name:"scrab",
            amount:2000,
            quantity:2
        },
        {
            name:"soap",
            amount:1500,
            quantity:1
        }
    ],
    currency:"jpy",
    paymentMethodId:null
}

var style = {
    base:{
        color:"#32325d",
    }
}

var card = elements.create("card",{ style:style });
card.mount("#card-element");

card.on('change',({error}) => {
    const displayError = document.getElementById('card-errors');
    if (error) {
        displayError.textContent = error.message;
    } else {
        displayError.textContent = '';
    }
});

// 注文確定ボタンのDOMを取得する
const submitButton = document.getElementById("payment-form-submit");

// ボタンがクリックされたら、アクションを実行 
submitButton.addEventListener("click", function(event) {

    hideButton();
    displaySpinner();
    
    stripe
    .createPaymentMethod("card",card)// Promiseが返ってくるので、thenで処理を続ける
    .then(function(result) {
        if(result.error) {
            onError();
        } else {
            // 成功時にサーバサイドに注文情報を送信する
            order.paymentMethodId = result.paymentMethod.id
            // サーバサイドへ決済情報を渡して結果をハンドリング
            // サーバはhttp://localhost:3000/v1/order/payment にPOSTでリクエスト
            //  第一引数 : リクエストURI
            //  第二引数 : リクエストオプション            
            fetch("http://localhost:3000/v1/order/payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(order)})
            .then(function(result) {
                return result.json();
            })
            .then(function(response) {
                onComplete(response);
            });
        }

    })
    .catch(function() {
        onError();
    })
});

let returnButtonNormal = document.getElementById("return-button-normal");
let returnButtonError = document.getElementById("return-button-error");
let returnButtonNotYet = document.getElementById("return-button-not-yet");
let returnButtonDefault = document.getElementById("return-button-default");

returnButtonNormal.addEventListener("click", reset);
returnButtonError.addEventListener("click", reset);
returnButtonNotYet.addEventListener("click", reset);
returnButtonDefault.addEventListener("click", reset);

function reset(event) {
    hideError();
    hideMessage();
    hideNotYetMessage();
    displayButton();

    card.mount("#card-element");
}

function onComplete(response) {

    hideSpinner();

    if(response.error) {
        onError()
    } else if (response.paymentIntentStatus === "succeeded") {
        displayMessage();
    } else {
        displayNotYetMessage();
    }
}

function onError() {

    shutdown();
    if(!document.querySelector(".spinner-border").classList.contains("collapse")) {
        hideSpinner();
    }
    displayError();
}

function shutdown() {
    // Stripeの input タグの非表示
    // 注文確定ボタンを非表示
    // エラー、成功時どちらにも共通しているので共通化
    card.unmount();
    hideButton();
}

function hideSpinner() {
    document.querySelector(".spinner-border").classList.add("collapse")
}

function displaySpinner() {
    document.querySelector(".spinner-border").classList.remove("collapse");
}
// エラーメッセージ
function hideError() {
    document.querySelector(".contents-payment-error").classList.add("collapse");
}

function displayError() {
    document.querySelector(".contents-payment-error").classList.remove("collapse");
}

// 成功メッセージ
function displayMessage() {
    document.querySelector(".contents-payment-result").classList.remove("collapse");
}

function hideMessage() {
    document.querySelector(".contents-payment-result").classList.add("collapse");
}

function displayNotYetMessage() {
    document.querySelector(".contents-payment-not-yet").classList.remove("collapse");
}

function hideNotYetMessage() {
    document.querySelector(".contents-payment-not-yet").classList.add("collapse");
}

function hideButton() {
    document.querySelector("#payment-form-submit").classList.add("collapse");
}

function displayButton() {
    document.querySelector("#payment-form-submit").classList.remove("collapse");
}