package com.rentverify.app.ui.screens.detail

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.rememberAsyncImagePainter
import com.rentverify.app.ui.components.StatusBadge
import com.rentverify.app.ui.theme.*
import com.rentverify.app.util.calculateNights
import com.rentverify.app.util.formatDate
import com.rentverify.app.util.formatRelativeTime
import com.rentverify.app.util.formatTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GuestDetailScreen(
    verificationId: String,
    onBack: () -> Unit,
    onNavigateToAudit: (String) -> Unit,
    viewModel: GuestDetailViewModel = hiltViewModel()
) {
    val verification by viewModel.verification.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var showApproveDialog by remember { mutableStateOf(false) }
    var showRejectDialog by remember { mutableStateOf(false) }
    var showFlagDialog by remember { mutableStateOf(false) }
    var activeZoomImage by remember { mutableStateOf<String?>(null) }

    var guardianNoteInput by remember { mutableStateOf("") }
    var rejectionReasonInput by remember { mutableStateOf("Missing ID") }
    var flagReasonInput by remember { mutableStateOf("Suspicious details") }

    val rejectionOptions = listOf("Missing ID", "Blurry Photo", "Wrong Person", "Incorrect Details", "Expired ID", "Other")
    val flagOptions = listOf("Suspicious details", "Invalid ID documentation", "Name mismatch", "Needs manual contact", "Other")

    LaunchedEffect(verificationId) {
        viewModel.loadVerification(verificationId)
    }

    LaunchedEffect(Unit) {
        viewModel.actionMessage.collect { msg ->
            snackbarHostState.showSnackbar(msg)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Guest Details", color = TextPrimary, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                actions = {
                    verification?.let { v ->
                        IconButton(onClick = { onNavigateToAudit(v.id) }) {
                            Icon(Icons.Default.Timeline, contentDescription = "Audit History", tint = Purple300)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg)
            )
        }
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize().background(DarkBg), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Purple500)
            }
            return@Scaffold
        }

        val v = verification ?: run {
            Box(Modifier.fillMaxSize().background(DarkBg), contentAlignment = Alignment.Center) {
                Text("Verification not found", color = TextMuted)
            }
            return@Scaffold
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(DarkBg)
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ── 1. Comparison section ──────────────────────────
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Does this person match their ID?",
                        color = TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Selfie Photo
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("GUEST SELFIE", color = TextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(6.dp))
                            Box(
                                modifier = Modifier
                                    .aspectRatio(1f)
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(DarkBg)
                                    .clickable { v.selfieData?.let { activeZoomImage = it } },
                                contentAlignment = Alignment.Center
                            ) {
                                if (v.selfieData != null) {
                                    Image(
                                        painter = rememberAsyncImagePainter(model = v.selfieData),
                                        contentDescription = "Selfie",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                } else {
                                    Text("No Selfie", color = TextMuted, fontSize = 12.sp)
                                }
                            }
                        }

                        // ID Photo
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.weight(1f)
                        ) {
                            Text((v.idType ?: "GOVERNMENT ID").uppercase(), color = TextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(6.dp))
                            Box(
                                modifier = Modifier
                                    .aspectRatio(1f)
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(DarkBg)
                                    .clickable { v.idImageData?.let { activeZoomImage = it } },
                                contentAlignment = Alignment.Center
                            ) {
                                if (v.idImageData != null) {
                                    Image(
                                        painter = rememberAsyncImagePainter(model = v.idImageData),
                                        contentDescription = "ID Card",
                                        contentScale = ContentScale.Fit,
                                        modifier = Modifier.fillMaxSize().padding(4.dp)
                                    )
                                } else {
                                    Text("No ID Uploaded", color = TextMuted, fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }

            // ── 2. Personal Info Card ──────────────────────────
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Guest Profile", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        StatusBadge(status = v.status)
                    }
                    Spacer(Modifier.height(12.dp))
                    InfoRow("Guest Name", v.guestName)
                    InfoRow("Phone", v.guestPhone)
                    InfoRow("Email", v.guestEmail ?: "—")
                    InfoRow("Total Guests", "👤 ${v.guestCount}")
                    InfoRow("Purpose", v.purpose)
                    InfoRow("Booking Platform", v.bookingPlatform ?: "—")
                    InfoRow("Ref Code", v.refCode)
                }
            }

            // ── 3. Stay Details Card ───────────────────────────
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Stay Details", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(Modifier.height(12.dp))
                    InfoRow("Check-in", "${formatDate(v.checkinDate)} at ${formatTime(v.checkinTime)}")
                    InfoRow("Check-out", "${formatDate(v.checkoutDate)} at ${formatTime(v.checkoutTime)}")
                    InfoRow("Stay Duration", "${calculateNights(v.checkinDate, v.checkoutDate)} night(s)")
                }
            }

            // ── 4. Verification Status Details ────────────────
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Verification Status", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(Modifier.height(12.dp))
                    InfoRow("Submitted", formatRelativeTime(v.submittedAt))
                    v.reviewedAt?.let { InfoRow("Reviewed At", formatRelativeTime(it)) }
                    v.reviewedBy?.let { InfoRow("Reviewed By", it) }
                }
            }

            // ── 5. Rejection/Flag/Note displays ───────────────
            if (v.status != "pending") {
                v.rejectionReason?.let {
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Red500.copy(alpha = 0.1f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Rejection Reason", color = Red500, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(it, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                v.flagReason?.let {
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = StatusFlagged.copy(alpha = 0.15f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Flag Reason", color = StatusFlagged, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(it, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                v.guardianNote?.let {
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkSurface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Guardian Note", color = TextSecondary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("\"$it\"", color = TextPrimary, fontSize = 14.sp, fontStyle = FontStyle.Italic)
                        }
                    }
                }
            } else {
                // Guardian Note Input (if pending)
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Review Note (Optional)",
                        color = TextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                    OutlinedTextField(
                        value = guardianNoteInput,
                        onValueChange = { guardianNoteInput = it },
                        placeholder = { Text("Add your audit notes, observations, or conditions...", color = TextMuted) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Purple500,
                            unfocusedBorderColor = TextMuted.copy(alpha = 0.3f),
                            focusedContainerColor = DarkSurface,
                            unfocusedContainerColor = DarkSurface,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Primary Decision Buttons
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = { showApproveDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = Green500),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth().height(52.dp)
                    ) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Approve Guest", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            onClick = { showRejectDialog = true },
                            colors = ButtonDefaults.buttonColors(containerColor = Red500),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f).height(46.dp)
                        ) {
                            Icon(Icons.Default.Block, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Reject", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }

                        Button(
                            onClick = { showFlagDialog = true },
                            colors = ButtonDefaults.buttonColors(containerColor = StatusFlagged),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f).height(46.dp)
                        ) {
                            Icon(Icons.Default.Flag, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Flag", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }
        }
    }

    // ── Dialogs ───────────────────────────────────────────

    // Fullscreen Image Zoom Dialog
    activeZoomImage?.let { src ->
        Dialog(
            onDismissRequest = { activeZoomImage = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.95f))
                    .clickable { activeZoomImage = null },
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = rememberAsyncImagePainter(model = src),
                    contentDescription = "Zoomed Photo",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxWidth().fillMaxHeight(0.85f)
                )
                IconButton(
                    onClick = { activeZoomImage = null },
                    modifier = Modifier.align(Alignment.TopEnd).padding(16.dp)
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White, modifier = Modifier.size(32.dp))
                }
            }
        }
    }

    // Approval Confirmation Dialog
    if (showApproveDialog) {
        AlertDialog(
            onDismissRequest = { showApproveDialog = false },
            title = { Text("Approve Guest?", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = { Text("Approve ${verification?.guestName} for check-in on ${formatDate(verification?.checkinDate)}?", color = TextSecondary) },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.approve(guardianNoteInput)
                        showApproveDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Green500)
                ) {
                    Text("Approve")
                }
            },
            dismissButton = {
                TextButton(onClick = { showApproveDialog = false }) {
                    Text("Cancel", color = TextMuted)
                }
            },
            containerColor = DarkSurface
        )
    }

    // Rejection Dialog with Reasons
    if (showRejectDialog) {
        AlertDialog(
            onDismissRequest = { showRejectDialog = false },
            title = { Text("Reject Verification", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Select a reason for rejection:", color = TextSecondary, fontSize = 13.sp)
                    rejectionOptions.forEach { option ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { rejectionReasonInput = option }
                                .padding(vertical = 6.dp)
                        ) {
                            RadioButton(
                                selected = rejectionReasonInput == option,
                                onClick = { rejectionReasonInput = option },
                                colors = RadioButtonDefaults.colors(selectedColor = Red500)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(option, color = TextPrimary, fontSize = 14.sp)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.reject(rejectionReasonInput, guardianNoteInput)
                        showRejectDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Red500)
                ) {
                    Text("Reject Guest")
                }
            },
            dismissButton = {
                TextButton(onClick = { showRejectDialog = false }) {
                    Text("Cancel", color = TextMuted)
                }
            },
            containerColor = DarkSurface
        )
    }

    // Flagging Dialog with Reasons
    if (showFlagDialog) {
        AlertDialog(
            onDismissRequest = { showFlagDialog = false },
            title = { Text("Flag for Review", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Select a reason for flagging:", color = TextSecondary, fontSize = 13.sp)
                    flagOptions.forEach { option ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { flagReasonInput = option }
                                .padding(vertical = 6.dp)
                        ) {
                            RadioButton(
                                selected = flagReasonInput == option,
                                onClick = { flagReasonInput = option },
                                colors = RadioButtonDefaults.colors(selectedColor = StatusFlagged)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(option, color = TextPrimary, fontSize = 14.sp)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.flag(flagReasonInput, guardianNoteInput)
                        showFlagDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = StatusFlagged)
                ) {
                    Text("Flag Guest")
                }
            },
            dismissButton = {
                TextButton(onClick = { showFlagDialog = false }) {
                    Text("Cancel", color = TextMuted)
                }
            },
            containerColor = DarkSurface
        )
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 5.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = TextSecondary, fontSize = 13.sp)
        Text(value, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.End)
    }
}
