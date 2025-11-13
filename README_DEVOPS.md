# BuyIndiaX - AWS DevOps Setup (MINIMAL)

## 🎯 What You Need

Your teacher wants to see:
- ✅ **Terraform** - Infrastructure as Code
- ✅ **Puppet** - Configuration Management  
- ✅ **AWS EC2** - Cloud Computing
- ✅ **Nagios** - Monitoring

**Total Code: 30 lines**

---

## 📁 Files Structure

```
BuyIndiaX/
├── README_DEVOPS.md          ← You are here (start guide)
├── ABSOLUTE_MINIMUM.md       ← Copy-paste setup (5 min)
├── CODE_COMPARISON.md        ← See code reduction
├── START_HERE.md             ← Quick reference
├── PROJECT_PRESENTATION.md   ← 10-min presentation
│
├── terraform/
│   └── absolute_min.tf       ← 15 lines (Infrastructure)
│
├── puppet/
│   └── absolute_min.pp       ← 10 lines (Deployment)
│
└── nagios/
    └── absolute_min.cfg      ← 5 lines (Monitoring)
```

**That's it! Only 3 code files + 5 docs = 8 files total**

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Prerequisites (One-time)
```bash
# Install AWS CLI
# Windows: choco install awscli
# Mac: brew install awscli
# Linux: sudo apt install awscli

# Install Terraform
# Windows: choco install terraform
# Mac: brew install terraform
# Linux: Download from terraform.io

# Configure AWS
aws configure
# Enter your Access Key and Secret Key

# Create SSH key in AWS Console
# EC2 → Key Pairs → Create → Name: buyindiax-key
# Download to ~/.ssh/buyindiax-key.pem
chmod 400 ~/.ssh/buyindiax-key.pem
```

### Step 2: Deploy Everything
```bash
# Open the guide
cat ABSOLUTE_MINIMUM.md

# Copy-paste the ONE command from that file
# Wait 5 minutes
# Done!
```

---

## 📊 What Each Tool Does

### 1. Terraform (15 lines)
**Purpose**: Automates AWS infrastructure creation

**What it does**:
- Creates EC2 instance (virtual server)
- Configures security (firewall rules)
- Installs basic software
- Outputs server IP

**Advantages**:
- ✅ Automated (no manual clicking)
- ✅ Reproducible (run again = same result)
- ✅ Version controlled (track changes)
- ✅ Fast (creates in 2 minutes)

**Disadvantages**:
- ❌ Costs money (after free tier)
- ❌ Requires AWS account
- ❌ Can accidentally delete resources
- ❌ Learning curve

**File**: `terraform/absolute_min.tf`

---

### 2. Puppet (10 lines)
**Purpose**: Automates application deployment

**What it does**:
- Clones your GitHub repository
- Installs Node.js dependencies
- Creates environment file
- Starts application with PM2

**Advantages**:
- ✅ Consistent deployment
- ✅ Idempotent (safe to run multiple times)
- ✅ Automated (no manual commands)
- ✅ Declarative (say what, not how)

**Disadvantages**:
- ❌ Additional complexity
- ❌ Requires Puppet agent
- ❌ Learning curve
- ❌ Debugging can be tricky

**File**: `puppet/absolute_min.pp`

---

### 3. AWS EC2 (Cloud Service)
**Purpose**: Provides virtual servers

**What it does**:
- Runs Ubuntu Linux server
- Hosts your MERN application
- Accessible via public IP
- Scalable compute power

**Advantages**:
- ✅ No physical hardware needed
- ✅ Scale up/down easily
- ✅ Pay-as-you-go
- ✅ Free tier (750 hours/month)
- ✅ Global availability

**Disadvantages**:
- ❌ Costs money (after free tier)
- ❌ Requires internet
- ❌ Need to manage security
- ❌ Need to manage updates

**Created by**: Terraform

---

### 4. Nagios (5 lines)
**Purpose**: Monitors application health

**What it does**:
- Checks if Node.js is running
- Checks if React is running
- Shows status in web dashboard
- Alerts if something fails

**Advantages**:
- ✅ Real-time monitoring
- ✅ Automatic alerts
- ✅ Performance metrics
- ✅ Free and open-source
- ✅ Web interface

**Disadvantages**:
- ❌ Complex full setup
- ❌ Old UI design
- ❌ Resource intensive
- ❌ Requires configuration

**File**: `nagios/absolute_min.cfg`

---

## 💰 Cost Breakdown

### Free Tier (First 12 Months)
- **EC2 t2.micro**: 750 hours/month FREE
- **Storage**: 30GB FREE
- **Data Transfer**: 1GB/month FREE

**Your setup uses**: 1 t2.micro instance = FREE ✅

### After Free Tier
- **EC2 t2.micro**: ~$8.50/month
- **Storage**: ~$3/month
- **Total**: ~$11.50/month

### How to Minimize Costs
```bash
# Stop instance when not using (still charged for storage)
aws ec2 stop-instances --instance-ids i-xxxxx

# Destroy everything (no charges)
terraform destroy -auto-approve
```

---

## 🎓 For Your Teacher

### What to Show

1. **Code Files** (3 files, 30 lines total)
   - `terraform/absolute_min.tf` - Infrastructure
   - `puppet/absolute_min.pp` - Deployment
   - `nagios/absolute_min.cfg` - Monitoring

2. **AWS Console**
   - Show running EC2 instance
   - Show security groups
   - Show instance details

3. **Live Application**
   - Open http://SERVER_IP:3000
   - Show working website
   - Register/login/browse products

4. **Nagios Dashboard**
   - Open http://SERVER_IP/nagios4
   - Show service checks (green = OK)
   - Explain monitoring

### What to Explain

**Terraform**:
"Terraform automates infrastructure creation. Instead of manually clicking in AWS Console, I wrote 15 lines of code that creates the EC2 instance, security groups, and configuration automatically. This is Infrastructure as Code - I can version control it, reproduce it, and destroy it easily."

**Puppet**:
"Puppet automates application deployment. Instead of manually SSH-ing and running commands, I wrote 10 lines that clone the repository, install dependencies, and start the application. It's idempotent, meaning I can run it multiple times safely."

**EC2**:
"EC2 provides virtual servers in the cloud. Instead of buying physical hardware, I rent compute power from AWS. It's scalable, globally available, and I only pay for what I use. The free tier gives 750 hours/month."

**Nagios**:
"Nagios monitors the application health. It checks every 5 minutes if Node.js and React are running. If something fails, it shows red in the dashboard and can send alerts. This ensures uptime and quick problem detection."

### Key Points
- ✅ All 4 tools integrated
- ✅ Fully automated setup
- ✅ Minimal code (30 lines)
- ✅ Production concepts
- ✅ Free tier usage
- ✅ Working application

---

## 🐛 Troubleshooting

### Can't SSH to server?
```bash
chmod 400 ~/.ssh/buyindiax-key.pem
```

### Terraform fails?
```bash
# Check AWS credentials
aws sts get-caller-identity

# Retry
terraform destroy -auto-approve
terraform apply -auto-approve
```

### Application not working?
```bash
# SSH to server
ssh -i ~/.ssh/buyindiax-key.pem ubuntu@SERVER_IP

# Check PM2
pm2 list
pm2 logs

# Restart if needed
pm2 restart all
```

### Nagios not accessible?
```bash
# Wait 5 minutes after deployment
# Nagios takes time to start

# Check status
sudo systemctl status nagios4
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Can SSH to server
- [ ] Application loads at http://IP:3000
- [ ] Backend API responds at http://IP:5000/api/health
- [ ] Nagios dashboard at http://IP/nagios4
- [ ] Can register new user
- [ ] Can browse products
- [ ] Can add to cart
- [ ] Nagios shows services as GREEN

---

## 🚀 Next Steps

1. **Read** `ABSOLUTE_MINIMUM.md`
2. **Run** the one command
3. **Test** the application
4. **Show** to your teacher
5. **Explain** each tool
6. **Destroy** when done: `terraform destroy -auto-approve`

---

## 📚 Additional Resources

- **ABSOLUTE_MINIMUM.md** - Copy-paste setup guide
- **CODE_COMPARISON.md** - See how we reduced from 450 to 30 lines
- **START_HERE.md** - Quick reference
- **PROJECT_PRESENTATION.md** - 10-minute presentation guide

---

## 🎉 Summary

**You have:**
- 3 code files (30 lines total)
- 5 documentation files
- Complete DevOps pipeline
- All 4 required tools
- 5-minute setup
- Free tier eligible

**This is the ABSOLUTE MINIMUM to demonstrate Terraform, Puppet, EC2, and Nagios!**

---

**Ready? Open `ABSOLUTE_MINIMUM.md` and start! 🚀**
