package main

import (
    "fmt"
    "log"
    "net/http"
    
    "github.com/gin-gonic/gin"
)

func main() {
    router := gin.Default()
    
    router.GET("/ping", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "message": "pong",
        })
    })
    
    fmt.Println("Ascension server starting on :8080...")
    log.Fatal(router.Run(":8080"))
}
