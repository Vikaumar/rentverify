package com.rentverify.app.ui.screens.guest

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.rememberAsyncImagePainter
import com.rentverify.app.ui.theme.*
import com.rentverify.app.util.ImageUtils
import java.io.File

@Composable
fun PhotoUploadStep(
    type: String, // "selfie" or "id"
    initialImage: String?,
    idType: String = "Aadhaar",
    onIdTypeChange: ((String) -> Unit)? = null,
    onNext: (String) -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var imageBase64 by remember { mutableStateOf<String?>(initialImage) }
    var showDialog by remember { mutableStateOf(false) }

    // Setup temporary file for camera capture
    val tempFile = remember {
        File.createTempFile("cam_capture_", ".jpg", context.cacheDir).apply {
            deleteOnExit()
        }
    }
    val tempUri = remember {
        androidx.core.content.FileProvider.getUriForFile(
            context,
            "com.rentverify.app.fileprovider",
            tempFile
        )
    }

    val maxDim = if (type == "selfie") 800 else 1200

    // Camera Launcher
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) {
            val base64 = ImageUtils.uriToBase64(context, tempUri, maxDim)
            if (base64 != null) {
                imageBase64 = base64
            }
        }
    }

    // Gallery Launcher
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            val base64 = ImageUtils.uriToBase64(context, uri, maxDim)
            if (base64 != null) {
                imageBase64 = base64
            }
        }
    }

    val idTypes = listOf("Aadhaar", "Passport", "Driving License", "Voter ID", "Other")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Progress header
        ProgressHeader(
            step = if (type == "selfie") 2 else 3,
            totalSteps = 4,
            label = if (type == "selfie") "Take a Selfie" else "Government ID"
        )

        Column(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = if (type == "selfie") {
                    "Take a clear photo of your face. Remove sunglasses and hats."
                } else {
                    "Upload a clear photo of your government-issued ID."
                },
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )

            // ID Type Selector
            if (type == "id" && onIdTypeChange != null) {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                ) {
                    items(idTypes) { t ->
                        val active = idType == t
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(if (active) Purple500 else DarkSurface)
                                .clickable { onIdTypeChange(t) }
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = if (t == "Driving License") "DL" else t,
                                color = if (active) Color.White else TextSecondary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Photo Preview Area
            if (type == "selfie") {
                // Oval Shape for Selfie
                Box(
                    modifier = Modifier
                        .size(240.dp)
                        .clip(CircleShape)
                        .background(DarkSurface)
                        .border(2.dp, Purple500.copy(alpha = 0.5f), CircleShape)
                        .clickable { showDialog = true },
                    contentAlignment = Alignment.Center
                ) {
                    if (imageBase64 != null) {
                        Image(
                            painter = rememberAsyncImagePainter(model = imageBase64),
                            contentDescription = "Selfie Preview",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.CameraAlt, contentDescription = null, tint = Purple300, modifier = Modifier.size(48.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Tap to take a selfie", color = TextMuted, fontSize = 14.sp)
                        }
                    }
                }
            } else {
                // Rectangular Card Shape for ID
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(DarkSurface)
                        .border(2.dp, Purple500.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                        .clickable { showDialog = true },
                    contentAlignment = Alignment.Center
                ) {
                    if (imageBase64 != null) {
                        Image(
                            painter = rememberAsyncImagePainter(model = imageBase64),
                            contentDescription = "ID Preview",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(8.dp)
                        )
                    } else {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.CreditCard, contentDescription = null, tint = Purple300, modifier = Modifier.size(48.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Tap to upload or capture ID photo", color = TextMuted, fontSize = 14.sp)
                            Text("JPEG, PNG — Max 5MB", color = TextMuted.copy(alpha = 0.6f), fontSize = 11.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Selfie Tips
            if (type == "selfie" && imageBase64 == null) {
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("📸 Tips for a good photo:", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Text("• Face the camera directly", color = TextSecondary, fontSize = 12.sp)
                        Text("• Ensure good lighting", color = TextSecondary, fontSize = 12.sp)
                        Text("• Keep a neutral expression", color = TextSecondary, fontSize = 12.sp)
                    }
                }
            }

            // Image Set Actions (Retake / Use)
            if (imageBase64 != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            imageBase64 = null
                            showDialog = true
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary),
                        border = ButtonDefaults.outlinedButtonBorder.copy()
                    ) {
                        Text("Retake Photo", fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = { onNext(imageBase64!!) },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Purple500)
                    ) {
                        Text("Use This Photo →", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Back action (only when no image is selected to prevent losing photo)
        if (imageBase64 == null) {
            Button(
                onClick = onBack,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .padding(vertical = 4.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.Transparent,
                    contentColor = TextSecondary
                )
            ) {
                Text("← Back", fontWeight = FontWeight.Bold)
            }
        }
    }

    // Media Source Dialog
    if (showDialog) {
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = { Text("Choose Photo Source", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = { Text("Capture a new photo or select from your gallery.", color = TextSecondary) },
            confirmButton = {
                Button(
                    onClick = {
                        showDialog = false
                        cameraLauncher.launch(tempUri)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Purple500)
                ) {
                    Text("Camera")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showDialog = false
                        galleryLauncher.launch("image/*")
                    }
                ) {
                    Text("Gallery", color = Purple300)
                }
            },
            containerColor = DarkSurface
        )
    }
}
