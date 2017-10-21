/*
 * Copyright 2017 Waryam Soomro
 * Licensed under MIT 
 */
//Vue App

var defaultTermObj = {
    "def": false,
    "example": false,
    "cat": false,
    "syn": false,
    "ant": false
}

var mainApp = new Vue({
    el: "#mainApp",
    data: {
        isIndex: true,
        searchTerm: "",
        list_count: 24,
        current_page: 1,
        total_pages: 1,
        index_list: [],
        term_data: {},
        pageInput: "",
        term_attrib: Object.assign({}, defaultTermObj),
        current_term: "",
        current_type: "",
        previousIndexVisibility: "hidden",
        nextIndexVisibility: "visible",
        current_cat: []
    },

    methods: {
        checkBoxGo: function (checkText) {
            var check = false;

            if ((isFinite(checkText))) {
                const temp = parseFloat(checkText)
                if (Number.isInteger(temp)) {
                    this.goToPage(temp)
                } else {
                    check = true
                }

            } else {
                check = true
            }

            if (check) {
                alert("Invalid Input, Please Check")
            }

        },
        goToPage: function (pagenum) {
            const parentObj = this


            if ((pagenum >= 1 && pagenum <= this.total_pages)) {

                $.get(`/pagedata/${pagenum}`, function (data, status) {
                    if (status == "success") {


                        parentObj.current_page = pagenum
                        parentObj.previousIndexVisibility = (pagenum == 1) ? "hidden" : "visible"
                        parentObj.nextIndexVisibility = (pagenum == parentObj.total_pages) ? "hidden" : "visible"

                        parentObj.index_list = JSON.parse(data)


                    } else {
                        alert("Error While Getting Data.")
                    }
                });

            } else {
                alert(`Invalid Page Number.\n Should be between 1 and ${this.total_pages}`)
            }


        },
        getTermData: function (data_term) {
            const parentObj = this

            $.get(`data/${data_term}`, function (data, status) {
                if (status == "success") {

                    if (data != "{}") {
                        parentObj.current_term = data_term
                        parentObj.goToTermPage(JSON.parse(data))
                    } else {
                        alert(`No such term '${data_term}' in database.`)
                    }
                } else {
                    alert("Error While Getting Data.")
                }
            });



        },
        goToTermPage: function (termData) {
            const parentObj = this
            var temp
            parentObj.current_cat = []

            for (i in termData) {
                for (j of Object.keys(termData[i])) {

                    if (j == "cat") {
                        temp = termData[i][j]
                        parentObj.current_cat = parentObj.current_cat.concat(
                            temp.filter(function (cur_cat) {
                                return (!isFinite(cur_cat)) && (parentObj.current_cat.indexOf(cur_cat) == -1)
                            })
                        )


                    }

                    if (!(parentObj.term_attrib[j])) {
                        parentObj.term_attrib[j] = true;
                    }

                }
            }

            parentObj.current_type = Object.keys(termData).join(", ")
            parentObj.term_data = termData
            parentObj.isIndex = false


            parentObj.current_cat = parentObj.current_cat.slice(0, 6).join(", ")

            parentObj.speakWord(parentObj.current_term)

        },
        speakWord: function (utterSound) {
            speechSynthesis.speak(new SpeechSynthesisUtterance(utterSound))
        },
        goHome: function () {
            const parentObj = this
            parentObj.term_attrib = Object.assign({}, defaultTermObj)
            parentObj.isIndex = true
            parentObj.term_data = {}
            parentObj.current_term = ""
            parentObj.current_type = ""

            parentObj.current_cat = []

        }

    }
})

//front search input autocomplete
$("#frontsearch").autocomplete({
    minLength: 3,
    source: function (request, response) {

        $.get(`search/${request.term}`, function (data, status) {
            if (status == "success") {
                response(JSON.parse(data))
            }
        });

    }

});

$.get(`termsinitial/${mainApp.list_count}`, function (data, status) {
    if (status == "success") {
        temp = JSON.parse(data)
        mainApp.total_pages = Math.ceil(temp["total_terms"] / mainApp.list_count)
        mainApp.index_list = temp["terms"]
    } else {
        alert("Failed to Get Index Information")
    }
});