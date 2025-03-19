package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.POST("/api/auth/simple", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"token": "test_token",
			"isNewUser": true,
		})
	})
	r.Run(":8081")
}
