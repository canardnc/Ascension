package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

// Argon2Params représente les paramètres pour l'algorithme Argon2id
type Argon2Params struct {
	Memory      uint32
	Iterations  uint32
	Parallelism uint8
	SaltLength  uint32
	KeyLength   uint32
}

// Constantes pour la configuration par défaut d'Argon2id comme spécifié
// 19 MiB = 19456 KiB
const (
	DefaultMemory      = 19456 // 19 MiB en KiB
	DefaultIterations  = 2
	DefaultParallelism = 1
	DefaultSaltLength  = 16 // en octets
	DefaultKeyLength   = 32 // en octets
)

// DefaultParams est la configuration par défaut d'Argon2id
var DefaultParams = &Argon2Params{
	Memory:      DefaultMemory,
	Iterations:  DefaultIterations,
	Parallelism: DefaultParallelism,
	SaltLength:  DefaultSaltLength,
	KeyLength:   DefaultKeyLength,
}

// GenerateSalt génère un sel aléatoire de la longueur spécifiée
func GenerateSalt(length uint32) ([]byte, error) {
	salt := make([]byte, length)
	_, err := rand.Read(salt)
	if err != nil {
		return nil, err
	}
	return salt, nil
}

// HashPassword hache un mot de passe en utilisant Argon2id avec les paramètres spécifiés
func HashPassword(password string, params *Argon2Params) (string, string, error) {
	// Valider le mot de passe
	if len(password) == 0 {
		return "", "", errors.New("mot de passe vide")
	}

	// Générer un salt aléatoire
	salt, err := GenerateSalt(params.SaltLength)
	if err != nil {
		return "", "", err
	}

	// Hacher le mot de passe avec Argon2id
	hash := argon2.IDKey(
		[]byte(password),
		salt,
		params.Iterations,
		params.Memory,
		params.Parallelism,
		params.KeyLength,
	)

	// Encoder en base64 pour le stockage
	b64Salt := base64.StdEncoding.EncodeToString(salt)
	b64Hash := base64.StdEncoding.EncodeToString(hash)

	// Format: $argon2id$v=19$m=memoire,t=iterations,p=parallélisme$salt$hash
	encodedHash := fmt.Sprintf(
		"$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
		params.Memory,
		params.Iterations,
		params.Parallelism,
		b64Salt,
		b64Hash,
	)

	return encodedHash, b64Salt, nil
}

// VerifyPassword vérifie si un mot de passe correspond à un hash stocké
func VerifyPassword(password, encodedHash string) (bool, error) {
	// Extraire les paramètres, le sel et le hash du hash encodé
	vals := strings.Split(encodedHash, "$")
	if len(vals) != 6 {
		return false, errors.New("hash mal formaté")
	}

	var version int
	_, err := fmt.Sscanf(vals[2], "v=%d", &version)
	if err != nil {
		return false, errors.New("impossible d'extraire la version")
	}

	// Extraire les paramètres
	var memory uint32
	var iterations uint32
	var parallelism uint8
	_, err = fmt.Sscanf(
		vals[3],
		"m=%d,t=%d,p=%d",
		&memory,
		&iterations,
		&parallelism,
	)
	if err != nil {
		return false, errors.New("impossible d'extraire les paramètres")
	}

	// Décoder le sel
	salt, err := base64.StdEncoding.DecodeString(vals[4])
	if err != nil {
		return false, errors.New("impossible de décoder le sel")
	}

	// Décoder le hash
	decodedHash, err := base64.StdEncoding.DecodeString(vals[5])
	if err != nil {
		return false, errors.New("impossible de décoder le hash")
	}

	// Calculer le hash du mot de passe fourni avec les mêmes paramètres
	keyLength := uint32(len(decodedHash))
	comparisonHash := argon2.IDKey(
		[]byte(password),
		salt,
		iterations,
		memory,
		parallelism,
		keyLength,
	)

	// Comparer les hash de manière sécurisée contre les attaques par timing
	return subtle.ConstantTimeCompare(decodedHash, comparisonHash) == 1, nil
}

// HashPasswordWithDefaultParams hache un mot de passe avec les paramètres par défaut
func HashPasswordWithDefaultParams(password string) (string, string, error) {
	return HashPassword(password, DefaultParams)
}
